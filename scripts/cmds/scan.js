const fs = require("fs-extra");
const path = require("path");

const dataDir = path.join(__dirname, "cache");
const dataFile = path.join(dataDir, "scan_files.json");
const baselineFile = path.join(dataDir, "scan_baseline.json");

function initStorage() {
  fs.ensureDirSync(dataDir);
  if (!fs.existsSync(dataFile)) {
    fs.writeJsonSync(dataFile, { files: [], deleted: [] }, { spaces: 2 });
  }
}

function loadStore() {
  initStorage();
  const raw = fs.readJsonSync(dataFile, { throws: false }) || {};
  return {
    files: Array.isArray(raw.files) ? raw.files : [],
    deleted: Array.isArray(raw.deleted) ? raw.deleted : []
  };
}

function saveStore(store) {
  initStorage();
  fs.writeJsonSync(dataFile, store, { spaces: 2 });
}

function getAllCurrentJsFiles() {
  const rootDir = process.cwd();
  const scanDirs = [
    path.resolve(rootDir, "scripts/cmds"),
    path.resolve(rootDir, "scripts/events")
  ];

  const results = [];
  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isFile() || !ent.name.endsWith(".js")) continue;
      if (ent.name === "scan.js") continue;
      const fullPath = path.join(dir, ent.name);
      let mtimeMs = 0;
      try {
        mtimeMs = fs.statSync(fullPath).mtimeMs || 0;
      } catch (e) {}
      results.push({
        name: ent.name,
        path: fullPath,
        status: "Installed",
        mtimeMs
      });
    }
  }
  return results;
}

function ensureBaseline() {
  initStorage();
  const current = getAllCurrentJsFiles();
  if (!fs.existsSync(baselineFile)) {
    const existingNames = current.map((f) => f.path);
    fs.writeJsonSync(baselineFile, { existing: existingNames }, { spaces: 2 });
    return new Set(existingNames);
  }
  const snap = fs.readJsonSync(baselineFile, { throws: false }) || {};
  return new Set(Array.isArray(snap.existing) ? snap.existing : []);
}

function scanNewlyInstalledFiles(deletedSet) {
  const baselineSet = ensureBaseline();
  const current = getAllCurrentJsFiles();

  const newlyAdded = current.filter(
    (item) => !baselineSet.has(item.path) && !deletedSet.has(item.path)
  );

  newlyAdded.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return newlyAdded.map(({ name, path: filePath, status }) => ({
    name,
    path: filePath,
    status
  }));
}

function getActiveFiles() {
  const store = loadStore();
  const deletedSet = new Set(store.deleted);

  const tracked = store.files
    .filter((item) => item && !deletedSet.has(item.path))
    .map((item) => ({
      name: item.name || path.basename(item.path || ""),
      path: item.path,
      status: item.status || "Installed"
    }));

  const newlyInstalled = scanNewlyInstalledFiles(deletedSet);
  const seenPaths = new Set(tracked.map((x) => x.path));
  const merged = [...tracked];

  for (const item of newlyInstalled) {
    if (!seenPaths.has(item.path)) {
      seenPaths.add(item.path);
      merged.push(item);
    }
  }

  return merged;
}

function findFilePath(target) {
  if (!target) return null;
  const clean = String(target).trim();
  const rootDir = process.cwd();

  const pathsToCheck = [
    path.isAbsolute(clean) ? clean : null,
    path.resolve(rootDir, clean),
    path.resolve(rootDir, "scripts/cmds", clean),
    path.resolve(rootDir, "scripts/events", clean)
  ].filter(Boolean);

  for (const p of pathsToCheck) {
    if (fs.existsSync(p)) return p;
  }
  return pathsToCheck[0] || null;
}

function formatScanList(files) {
  if (!files.length) {
    return `╭•┄┅════❁🌺❁════┅┄•╮
📂 𝗦𝗖𝗔𝗡𝗡𝗘𝗗 𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗘𝗗 𝗙𝗜𝗟𝗘𝗦
╰•┄┅════❁🌺❁════┅┄•╯

✨ No newly installed files from Messenger yet.
💡 After running install, type scan to view them.`;
  }

  const listText = files.map((entry, i) => {
    const serial = i + 1;
    const fName = entry.name || path.basename(entry.path || "");
    const fState = entry.status || "Installed";
    return `🔹 **${serial}.** \`${fName}\` — *${fState}*`;
  });

  return `╭•┄┅════❁🌺❁════┅┄•╮
📂 𝗦𝗖𝗔𝗡𝗡𝗘𝗗 𝗜𝗡𝗦𝗧𝗔𝗟𝗟𝗘𝗗 𝗙𝗜𝗟𝗘𝗦
╰•┄┅════❁🌺❁════┅┄•╯

${listText.join("\n")}

✢━━━━━━━━━━━━━━━✢
💬 **Reply** to this message with:
👉 \`dlt 1\` (Delete file number 1)
👉 \`dlt 1, 2\` (Delete multiple files)
╰────────────♡彡`;
}

module.exports = {
  config: {
    name: "scan",
    aliases: [],
    version: "1.0",
    author: "siyam virus",
    countDown: 3,
    role: 0,
    category: "utility",
    guide: {
      en: "Type 'scan' (no prefix) to view files installed after baseline, then reply 'dlt <number>' to delete."
    }
  },

  onStart: async function ({ message, args, event }) {
    return runScan({ message, args, event });
  },

  onChat: async function ({ message, args, event }) {
    const msgBody = (event?.body || "").trim();
    if (!msgBody) return;

    const lowerBody = msgBody.toLowerCase();
    if (lowerBody === "scan" || lowerBody.startsWith("scan ")) {
      const extraArgs = msgBody.split(/\s+/).slice(1);
      return runScan({ message, args: extraArgs, event });
    }
  },

  onReply: async function ({ message, event, Reply }) {
    if (!Reply || Reply.author !== event.senderID) return;

    const replyText = (event?.body || "").trim();
    const cmdMatch = replyText.match(/^dlt\s+(.+)$/i);
    if (!cmdMatch) return;

    const targetNums = cmdMatch[1]
      .split(/[\s,]+/)
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);

    if (!targetNums.length) {
      return message.reply("❌ Please enter a valid number, e.g. `dlt 1`");
    }

    const activeFiles = getActiveFiles();
    if (!activeFiles.length) {
      return message.reply("⚠️ No files available in the list to delete.");
    }

    const store = loadStore();
    const deletedSet = new Set(store.deleted);
    const sortedDesc = [...new Set(targetNums)].sort((a, b) => b - a);
    const removedList = [];
    const badNums = [];
    const errorFiles = [];

    for (const num of sortedDesc) {
      const idx = num - 1;
      if (idx < 0 || idx >= activeFiles.length) {
        badNums.push(num);
        continue;
      }

      const item = activeFiles[idx];
      const fName = item.name || path.basename(item.path || "");
      const fullPath = findFilePath(item.path || fName);

      try {
        if (fullPath && fs.existsSync(fullPath)) {
          await fs.remove(fullPath);
        }
        if (fullPath) deletedSet.add(fullPath);
        if (item.path) deletedSet.add(item.path);
        store.files = store.files.filter((x) => x && x.path !== item.path && x.name !== fName);
        removedList.push(`${num}. ${fName}`);
      } catch (err) {
        errorFiles.push(`${num}. ${fName}`);
      }
    }

    store.deleted = [...deletedSet];
    saveStore(store);

    const statusBlocks = [];
    if (removedList.length) {
      statusBlocks.push(`🗑️ **Successfully deleted:**\n${removedList.reverse().map((x) => `✅ ${x}`).join("\n")}`);
    }
    if (errorFiles.length) {
      statusBlocks.push(`⚠️ **Could not delete from system:**\n${errorFiles.join("\n")}`);
    }
    if (badNums.length) {
      statusBlocks.push(`❌ **Invalid numbers:** ${badNums.join(", ")}`);
    }

    await message.reply(statusBlocks.join("\n\n"));

    const nextListMsg = await message.reply(formatScanList(getActiveFiles()));
    global.GoatBot.onReply.set(nextListMsg.messageID, {
      commandName: module.exports.config.name,
      messageID: nextListMsg.messageID,
      author: event.senderID
    });
  }
};

async function runScan({ message, args, event }) {
  const action = (args[0] || "").toLowerCase();

  if (action === "reset") {
    const current = getAllCurrentJsFiles().map((f) => f.path);
    fs.writeJsonSync(baselineFile, { existing: current }, { spaces: 2 });
    return message.reply("✅ Baseline updated. Only newly installed files after this point will appear.");
  }

  if (action === "add") {
    const fileArg = args.slice(1).join(" ").trim();
    if (!fileArg) {
      return message.reply("⚠️ Please provide a file name or path. Example: `scan add scripts/cmds/demo.js`");
    }

    const store = loadStore();
    const resolved = findFilePath(fileArg) || fileArg;
    const fName = path.basename(fileArg);

    store.deleted = store.deleted.filter((p) => p !== resolved && p !== fileArg);
    store.files.push({
      name: fName,
      path: resolved,
      status: "Installed"
    });

    saveStore(store);
    return message.reply(`✅ Added to list: \`${fName}\``);
  }

  const activeFiles = getActiveFiles();
  const sentMsg = await message.reply(formatScanList(activeFiles));

  global.GoatBot.onReply.set(sentMsg.messageID, {
    commandName: module.exports.config.name,
    messageID: sentMsg.messageID,
    author: event.senderID
  });
}
