const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const storeDir = path.join(__dirname, "cache");
const statusFile = path.join(storeDir, "ibna_status.json");
const msgMap = new Map();

function ensureStatusFile() {
  fs.ensureDirSync(storeDir);
  if (!fs.existsSync(statusFile)) {
    fs.writeJsonSync(statusFile, { enabledThreads: [] }, { spaces: 2 });
  }
}

function getEnabledThreads() {
  ensureStatusFile();
  const data = fs.readJsonSync(statusFile, { throws: false }) || {};
  return Array.isArray(data.enabledThreads) ? data.enabledThreads.map(String) : [];
}

function setThreadState(threadID, active) {
  const list = new Set(getEnabledThreads());
  const tid = String(threadID);
  if (active) list.add(tid);
  else list.delete(tid);
  fs.writeJsonSync(statusFile, { enabledThreads: [...list] }, { spaces: 2 });
}

function isThreadActive(threadID) {
  return getEnabledThreads().includes(String(threadID));
}

function storeIncomingMessage(event) {
  if (!event || !event.messageID) return;
  if (msgMap.size > 1500) {
    const oldestKey = msgMap.keys().next().value;
    if (oldestKey) msgMap.delete(oldestKey);
  }

  msgMap.set(String(event.messageID), {
    senderID: String(event.senderID || ""),
    threadID: String(event.threadID || ""),
    body: event.body || "",
    attachments: Array.isArray(event.attachments)
      ? event.attachments.map((att) => ({
          type: att.type,
          url: att.url || (att.payload && att.payload.url) || "",
          stickerID: att.stickerID || (att.payload && att.payload.stickerID) || null
        }))
      : []
  });
}

function isUnsentEvent(event) {
  if (!event) return false;
  if (event.type === "message_unsend" || event.type === "message_delete") {
    return Boolean(event.messageID);
  }
  if (event.logMessageType === "log:unsubscribe" && event.messageID) {
    return true;
  }
  return false;
}

async function resolveUserName(api, uid) {
  try {
    if (global.usersData && typeof global.usersData.getName === "function") {
      const n = await global.usersData.getName(uid);
      if (n) return n;
    }
  } catch (e) {}
  try {
    const info = await api.getUserInfo(uid);
    if (info && info[uid] && info[uid].name) return info[uid].name;
  } catch (e) {}
  return `User (${uid})`;
}

async function downloadTempAttachments(attachments) {
  const streams = [];
  const tempPaths = [];
  fs.ensureDirSync(storeDir);

  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i];
    if (!att || !att.url) continue;
    const ext = att.type === "sticker" || att.type === "photo" ? ".jpg" : ".bin";
    const tempPath = path.join(storeDir, `unsent_${Date.now()}_${i}${ext}`);
    try {
      const res = await axios.get(att.url, { responseType: "arraybuffer", timeout: 15000 });
      fs.writeFileSync(tempPath, Buffer.from(res.data));
      tempPaths.push(tempPath);
      streams.push(fs.createReadStream(tempPath));
    } catch (e) {}
  }

  return { streams, tempPaths };
}

function cleanupTemp(tempPaths) {
  for (const p of tempPaths) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {}
  }
}

function buildMentionPayload(text, targetName, uid) {
  if (!uid || !targetName) return undefined;
  const fromIndex = text.indexOf(targetName);
  if (fromIndex === -1) return undefined;
  return [{
    id: String(uid),
    tag: targetName,
    fromIndex
  }];
}

async function handleUnsentAlert({ api, event }) {
  const threadID = String(event.threadID || "");
  if (!isThreadActive(threadID)) return;

  const targetMsgID = String(event.messageID || "");
  const saved = msgMap.get(targetMsgID);
  const offenderID = String(event.senderID || (saved && saved.senderID) || "");
  const thiefName = offenderID ? await resolveUserName(api, offenderID) : "Unknown User";

  let contentPreview = "[Message was sent before bot cached it]";
  if (saved) {
    if (saved.body && saved.body.trim()) {
      contentPreview = saved.body.trim();
    } else if (saved.attachments && saved.attachments.length) {
      const types = saved.attachments.map((a) => a.type || "file");
      contentPreview = types.includes("sticker")
        ? "[Sticker]"
        : types.includes("photo")
        ? "[Photo]"
        : `[${types.join(", ")}]`;
    } else {
      contentPreview = "[Empty / Media]";
    }
  }

  const alertText = `╭•┄┅════❁👑❁════┅┄•╮
🚨 𝗨𝗡𝗦𝗘𝗡𝗧 𝗔𝗟𝗘𝗥𝗧
╰•┄┅════❁👑❁════┅┄•╯

সিয়াম বস তোমার রাজ্যে চোর ডুকেছে 🫣😩 দেখো চোরের মতো👉 ${thiefName} 👈 এই মেসেজটা ডিলিট করে পালাচ্ছে 😼 একদম গলা ধাক্কা দিতে দিতে বেটাকে তোমার সামনে আনলাম বস😎
  - তুমি এখন বলো এই বলদাকে মেরে কি ফাটিয়ে ফেলবো ??  😈🤓 সিয়াম বস আপনি একবার পারমিশন দেন এই কানাকে আমি মেরে ফাটিয়ে ফেলবো সবার সামনে ওর কত বড় সাহস আমিও দেখি 😡🔥😒 আমাকে আটকান বস আমি না হলে একটা বিশ্বযুদ্ধের সূচনা করেই ছাড়বো😩
╭──────────────────╮
📝 মেসেজ: ${contentPreview}
╰──────────────────╯`;

  const mentions = buildMentionPayload(alertText, thiefName, offenderID);

  let tempPaths = [];
  try {
    if (saved && Array.isArray(saved.attachments) && saved.attachments.length) {
      const stickerAtt = saved.attachments.find((a) => a.type === "sticker" && a.stickerID);
      if (stickerAtt && !saved.body) {
        const msgObj = mentions ? { body: alertText, mentions } : alertText;
        await api.sendMessage(msgObj, threadID);
        await api.sendMessage({ sticker: stickerAtt.stickerID }, threadID);
        return;
      }

      const mediaRes = await downloadTempAttachments(saved.attachments);
      tempPaths = mediaRes.tempPaths;
      if (mediaRes.streams.length) {
        const payload = { body: alertText, attachment: mediaRes.streams };
        if (mentions) payload.mentions = mentions;
        await api.sendMessage(payload, threadID);
        cleanupTemp(tempPaths);
        return;
      }
    }

    const finalMsg = mentions ? { body: alertText, mentions } : alertText;
    await api.sendMessage(finalMsg, threadID);
  } catch (err) {
    cleanupTemp(tempPaths);
  }
}

module.exports = {
  config: {
    name: "ibna",
    aliases: [],
    version: "1.4",
    author: "siyam virus",
    countDown: 2,
    role: 0,
    category: "box chat",
    guide: {
      en: "Type 'ibna on' or 'ibna off' (no prefix) to toggle unsent catcher in the group."
    }
  },

  onStart: async function ({ api, event, args }) {
    const mode = (args[0] || "").toLowerCase();
    if (mode === "on") {
      setThreadState(event.threadID, true);
      return api.sendMessage("আদেশ গ্রহণ করলাম জাহাপানা বিজ্ঞানী সিয়াম স্যার 👀🚩", event.threadID);
    }
    if (mode === "off") {
      setThreadState(event.threadID, false);
      return api.sendMessage("Oky my boss IBNA MOHAMMED SIYAM 🖤😌", event.threadID);
    }
    return api.sendMessage("Use: ibna on / ibna off", event.threadID);
  },

  onChat: async function ({ api, event }) {
    if (isUnsentEvent(event)) {
      return handleUnsentAlert({ api, event });
    }

    const rawBody = (event?.body || "").trim();
    const lowerBody = rawBody.toLowerCase();

    if (lowerBody === "ibna on") {
      setThreadState(event.threadID, true);
      return api.sendMessage("আদেশ গ্রহণ করলাম জাহাপানা বিজ্ঞানী সিয়াম স্যার 👀🚩", event.threadID, event.messageID);
    }

    if (lowerBody === "ibna off") {
      setThreadState(event.threadID, false);
      return api.sendMessage("Oky my boss IBNA MOHAMMED SIYAM 🖤😌", event.threadID, event.messageID);
    }

    storeIncomingMessage(event);
  },

  onEvent: async function ({ api, event }) {
    if (isUnsentEvent(event)) {
      return handleUnsentAlert({ api, event });
    }
    storeIncomingMessage(event);
  }
};
