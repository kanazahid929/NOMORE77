// Siyamvirus - Siyam-wp67 WhatsApp Bot Core
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

const PREFIX = "!";
const OWNER = "Siyamvirus";
const commands = new Map();
const chatHandlers = [];

const usersData = {
  get: async (id) => ({ id, name: "User" })
};

const threadsData = {
  get: async (id) => ({ id, settings: {}, data: {} })
};

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function loadCommands(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  try {
    if (!fs.statSync(dirPath).isDirectory()) return;
  } catch (_) {
    return;
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      try {
        delete require.cache[require.resolve(fullPath)];
        const cmd = require(fullPath);
        const name =
          cmd?.config?.name ||
          cmd?.name ||
          entry.name.replace(/\.js$/i, "").toLowerCase();

        if (name && typeof cmd === "function") {
          commands.set(name.toLowerCase(), cmd);
        } else if (name && typeof cmd?.run === "function") {
          commands.set(name.toLowerCase(), cmd.run);
        } else if (name && typeof cmd?.onStart === "function") {
          commands.set(name.toLowerCase(), cmd.onStart);
        }

        if (typeof cmd?.onChat === "function") {
          chatHandlers.push(cmd.onChat);
        }
      } catch (e) {
        console.log(`Failed to load ${entry.name} (${OWNER}): ${e.message}`);
      }
    }
  }
}

function buildApi(sock, msg) {
  const reactFn = async (emoji, messageID, threadID, cb) => {
    try {
      const target = threadID || msg.key.remoteJid;
      const res = await sock.sendMessage(target, {
        react: { text: emoji, key: msg.key }
      });
      if (typeof cb === "function") cb(null, res);
      return res;
    } catch (err) {
      if (typeof cb === "function") cb(err);
    }
  };

  const sendFn = async (body, threadID, callbackOrReplyID, maybeCallback) => {
    const target = threadID || msg.key.remoteJid;
    const quoteMsg = typeof callbackOrReplyID === "string" ? msg : null;
    const cb =
      typeof callbackOrReplyID === "function"
        ? callbackOrReplyID
        : typeof maybeCallback === "function"
        ? maybeCallback
        : null;

    try {
      const sendOpts = quoteMsg ? { quoted: quoteMsg } : {};
      let sent = null;

      if (typeof body === "string") {
        sent = await sock.sendMessage(target, { text: body }, sendOpts);
      } else if (body && typeof body === "object") {
        const caption = body.body ? String(body.body) : "";
        if (body.attachment) {
          let imagePayload = null;
          if (Buffer.isBuffer(body.attachment)) {
            imagePayload = body.attachment;
          } else if (typeof body.attachment === "string" && fs.existsSync(body.attachment)) {
            imagePayload = fs.readFileSync(body.attachment);
          } else if (body.attachment && typeof body.attachment[Symbol.asyncIterator] === "function") {
            imagePayload = await streamToBuffer(body.attachment);
          }

          if (imagePayload) {
            sent = await sock.sendMessage(
              target,
              { image: imagePayload, caption },
              sendOpts
            );
          }
        } else if (caption) {
          sent = await sock.sendMessage(target, { text: caption }, sendOpts);
        }
      }

      const formattedInfo = {
        messageID: sent?.key?.id || "",
        threadID: target
      };
      if (cb) cb(null, formattedInfo);
      return formattedInfo;
    } catch (err) {
      if (cb) cb(err);
    }
  };

  return {
    sendMessage: sendFn,
    reply: async (body, cb) => {
      return await sendFn(body, msg.key.remoteJid, msg.key.id, cb);
    },
    unsendMessage: async (messageID, cb) => {
      try {
        const res = await sock.sendMessage(msg.key.remoteJid, {
          delete: msg.key
        });
        if (typeof cb === "function") cb(null, res);
        return res;
      } catch (err) {
        if (typeof cb === "function") cb(err);
      }
    },
    setMessageReaction: reactFn,
    messageReaction: reactFn
  };
}

function buildEvent(msg, body, args, senderID, threadID, api) {
  const quotedText =
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
    "";
  const quotedSender =
    msg.message?.extendedTextMessage?.contextInfo?.participant || "";

  return {
    threadID,
    senderID,
    body,
    args,
    messageID: msg.key.id,
    isGroup: threadID.endsWith("@g.us"),
    reply: async (text, cb) => {
      return await api.sendMessage(text, threadID, msg.key.id, cb);
    },
    messageReply: quotedText
      ? { body: quotedText, senderID: quotedSender }
      : null
  };
}

async function boot() {
  commands.clear();
  chatHandlers.length = 0;

  loadCommands(path.join(__dirname, "cmds"));
  loadCommands(path.join(__dirname, "scripts", "cmds"));
  loadCommands(path.join(__dirname, "script", "cmd"));

  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        boot();
      }
    } else if (connection === "open") {
      console.log(`Connected | ${OWNER}`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const threadID = msg.key.remoteJid;
    const senderID = msg.key.participant || msg.key.remoteJid;
    const rawText = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""
    ).trim();

    if (!rawText) return;

    const api = buildApi(sock, msg);

    if (!rawText.startsWith(PREFIX)) {
      const event = buildEvent(msg, rawText, [], senderID, threadID, api);
      for (const onChatFn of chatHandlers) {
        try {
          await onChatFn({ api, event, args: [], usersData, threadsData });
        } catch (err) {
          console.error(`onChat error (${OWNER}):`, err.message);
        }
      }
      return;
    }

    const parts = rawText.slice(PREFIX.length).trim().split(/\s+/);
    const cmdName = parts.shift()?.toLowerCase();
    if (!cmdName) return;

    if (cmdName === "botinfo" || cmdName === "status") {
      await sock.sendMessage(threadID, {
        text: `Owner: ${OWNER}\nCommands Loaded: ${commands.size}`
      });
      return;
    }

    const handler = commands.get(cmdName);
    if (!handler) return;

    const event = buildEvent(msg, rawText, parts, senderID, threadID, api);

    try {
      await handler({ api, event, args: parts, usersData, threadsData });
    } catch (err) {
      await sock.sendMessage(threadID, {
        text: `Error: ${err.message}\nBy ${OWNER}`
      });
    }
  });
}

boot();
