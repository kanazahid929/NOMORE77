const os = require("os");
const fs = require("fs");
const path = require("path");

const BASE_DIR = process.cwd();
const SESSION_FILE = path.join(BASE_DIR, "session_active.json");
const RESTART_FLAG = path.join(BASE_DIR, "auto_restart.flag");

(function initSessionTracker() {
  const isScheduledRestart = fs.existsSync(RESTART_FLAG);

  if (isScheduledRestart) {
    try { fs.unlinkSync(RESTART_FLAG); } catch (e) {}
    if (!fs.existsSync(SESSION_FILE)) {
      fs.writeFileSync(SESSION_FILE, JSON.stringify({ startedAt: Date.now() }, null, 2));
    }
  } else {
    try {
      fs.writeFileSync(SESSION_FILE, JSON.stringify({ startedAt: Date.now() }, null, 2));
    } catch (e) {}
  }
})();

function getRealSessionUptime() {
  let startedAt = Date.now();
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
      if (data && typeof data.startedAt === "number") {
        startedAt = data.startedAt;
      }
    }
  } catch (e) {}

  const t = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const d = Math.floor(t / 86400);
  const h = Math.floor((t % 86400) / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;

  return `${d}d ${h}h ${m}m ${s}s`;
}

function formatUptMessage({ uptimeString, cpu, cores, usedMem, totalMem, hostname, prefix, totalUsers }) {
  return `
╭────────────◊⚡🏴‍☠️

—͟͞͞⸙⸙ 𝗨͜͡𝗽𝘁𝗶𝗺𝗲ღ❗🌪️—͟͞͞𝗦𝘆͜͡𝘀𝘁𝗲𝗺 

───❯❯⸙⸙🍷🚩 𝗨͟𝗽͟͠𝘁͟𝗶͟𝗺͟𝗲͟ : ${uptimeString}

───❯❯⸙ꪾ🌪️☠️❗ 𝗖͟𝗽͟͠𝘂͟ : ${cpu} (${cores} cores)

───⚠〄💫 𝗥𝗔𝗠 : ${usedMem.toFixed(2)} / ${totalMem.toFixed(2)} MB

────────⦿ 𝗛𝗼𝘀𝘁ღ 👀 : ${hostname}

──────◊ 𝗣𝗥𝗘⃟𝗙𝗜𝗫 ☠️❗ : ${prefix}

──────⦿ 𝗨𝘀𝗲͜͡𝗿 :☄️ ${totalUsers}💥💫

𝐖𝐡𝐨 𝐢͜͡𝐚𝐦 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐧𝐨 𝐢𝐝𝐞𝐚 🚩
𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫 𝐕𝐢𝐫𝐮𝐬 𝐬𝐢𝐲𝐚𝐦 🍾❕

╰────────────◊☄️👀❕
`;
}

module.exports = {
  config: {
    name: "up",
    version: "2.4",
    author: "xnil6x",
    role: 0,
    category: "system",
    guide: "upt"
  },

  onStart: async function ({ message, threadsData }) {
    await sendUpt(message, threadsData);
  },

  onChat: async function ({ message, event, threadsData }) {
    if (!event.body || event.body.toLowerCase() !== "up") return;
    await sendUpt(message, threadsData);
  }
};

async function sendUpt(message, threadsData) {
  const uptimeString = getRealSessionUptime();

  const cpu = os.cpus()[0].model;
  const cores = os.cpus().length;
  const usedMem = (os.totalmem() - os.freemem()) / 1024 / 1024;
  const totalMem = os.totalmem() / 1024 / 1024;

  const prefix = global.GoatBot?.config?.PREFIX || "/";
  const totalUsers = (await threadsData.getAll()).length;

  const body = formatUptMessage({ uptimeString, cpu, cores, usedMem, totalMem, hostname: os.hostname(), prefix, totalUsers });

  message.reply({
    body,
    attachment: await global.utils.getStreamFromUrl("https://drive.google.com/uc?id=1r9iaVFNA-WtGgOK0XJDXyKF8zFmQYzo_")
  });
}
