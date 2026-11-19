 const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const DRIVE_PIC_LINKS = [
  "https://drive.google.com/file/d/1sZfn9pHjT-2X9q8KLGmGqKjEgBcnN-hp/view?usp=drivesdk",
  "https://drive.google.com/file/d/1TwdEq1t6mlIs1rMJNfz0zL5vanazwzAI/view?usp=drivesdk"
];

const picIndexMap = new Map();
const tempDir = path.join(__dirname, "cache");

function getDirectDriveUrl(shareUrl) {
  const match = String(shareUrl || "").match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return shareUrl;
}

function getNextPicUrl(threadID) {
  const key = String(threadID || "default");
  const currentIdx = picIndexMap.get(key) || 0;
  const chosenUrl = DRIVE_PIC_LINKS[currentIdx % DRIVE_PIC_LINKS.length];
  picIndexMap.set(key, (currentIdx + 1) % DRIVE_PIC_LINKS.length);
  return getDirectDriveUrl(chosenUrl);
}

async function downloadPicStream(url) {
  fs.ensureDirSync(tempDir);
  const filePath = path.join(tempDir, `help2_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 15000,
    maxRedirects: 5
  });
  fs.writeFileSync(filePath, Buffer.from(res.data));
  return {
    stream: fs.createReadStream(filePath),
    cleanup: () => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
    }
  };
}

function getPrefix(threadID) {
  try {
    if (global.GoatBot && global.GoatBot.config) {
      const tid = String(threadID || "");
      const threadData = global.db && global.db.allThreadData
        ? global.db.allThreadData.find((t) => String(t.threadID) === tid)
        : null;
      if (threadData && threadData.data && threadData.data.prefix) {
        return threadData.data.prefix;
      }
      return global.GoatBot.config.prefix || "!";
    }
  } catch (e) {}
  return "!";
}

function listFilesInFolder(folderInput) {
  const rootDir = process.cwd();
  const cleaned = String(folderInput || "").trim().replace(/^\/+|\/+$/g, "");

  const candidates = [];
  if (!cleaned || cleaned === "cmds" || cleaned === "cmd") {
    candidates.push(path.resolve(rootDir, "scripts/cmds"));
  } else if (cleaned === "event" || cleaned === "events") {
    candidates.push(path.resolve(rootDir, "scripts/events"));
  } else {
    candidates.push(path.resolve(rootDir, cleaned));
    candidates.push(path.resolve(rootDir, "scripts", cleaned));
  }

  let targetDir = null;
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      targetDir = dir;
      break;
    }
  }

  if (!targetDir) {
    return { error: true, folder: cleaned || "scripts/cmds", files: [] };
  }

  const collected = [];

  function walk(dirPath, relPrefix = "") {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    items.sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
      const full = path.join(dirPath, item.name);
      const rel = relPrefix ? `${relPrefix}/${item.name}` : item.name;
      if (item.isDirectory()) {
        walk(full, rel);
      } else if (item.isFile()) {
        collected.push(rel.replace(/\.js$/i, ""));
      }
    }
  }

  walk(targetDir);
  const displayFolder = path.relative(rootDir, targetDir).replace(/\\/g, "/");
  return { error: false, folder: displayFolder, files: collected };
}

function buildMenuText({ prefix, folderLabel, files }) {
  const rows = files.map((name) => `┃ ✦ ${name}`).join("\n");

  return `╔═━「 𝐇𝐄𝐋𝐏 𝐌𝐄𝐍𝐔 」━═╗
┃ 🔑 Prefix: ${prefix}
┃ 📁 Folder: ${folderLabel}
┃ 📂 Total Files: ${files.length}
┃ ⚙ Available Files:
${rows || "┃ ✦ (No files found)"}
╚═━──────────────━═╝

📌 Type \`${prefix}help2 event\` to view \`scripts/events\` files
📌 Type \`${prefix}help2 <folder_name>\` to view any other folder (e.g. \`${prefix}help2 scripts\`)`;
}

async function sendHelpWithRotatingPic({ message, event, prefix, folderLabel, files }) {
  const text = buildMenuText({ prefix, folderLabel, files });
  const directUrl = getNextPicUrl(event?.threadID);

  try {
    const pic = await downloadPicStream(directUrl);
    await message.reply({
      body: text,
      attachment: pic.stream
    });
    pic.cleanup();
  } catch (e) {
    return message.reply(text);
  }
}

module.exports = {
  config: {
    name: "help2",
    aliases: [],
    version: "2.1",
    author: "siyam virus",
    countDown: 3,
    role: 0,
    category: "info",
    guide: {
      en: "{pn} | {pn} event | {pn} <folder_name>"
    }
  },

  onStart: async function ({ message, args, event }) {
    const prefix = getPrefix(event.threadID);
    const query = args.join(" ").trim();
    const res = listFilesInFolder(query || "cmds");

    if (res.error) {
      return message.reply(
        `❌ Folder not found: \`${res.folder}\`\n\n📌 Try \`${prefix}help2 event\` or \`${prefix}help2 scripts\``
      );
    }

    return sendHelpWithRotatingPic({
      message,
      event,
      prefix,
      folderLabel: res.folder,
      files: res.files
    });
  },

  onChat: async function ({ message, event }) {
    const body = (event?.body || "").trim();
    if (!body) return;
    const match = body.match(/^help2(?:\s+(.+))?$/i);
    if (!match) return;

    const prefix = getPrefix(event.threadID);
    const sub = (match[1] || "").trim();
    const res = listFilesInFolder(sub || "cmds");

    if (res.error) {
      return message.reply(
        `❌ Folder not found: \`${res.folder}\`\n\n📌 Try \`${prefix}help2 event\` or \`${prefix}help2 scripts\``
      );
    }

    return sendHelpWithRotatingPic({
      message,
      event,
      prefix,
      folderLabel: res.folder,
      files: res.files
    });
  }
};
