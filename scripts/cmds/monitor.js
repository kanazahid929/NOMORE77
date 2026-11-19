const activeMonitors = new Map();

module.exports = {
  config: {
    name: "monitor",
    aliases: [],
    version: "5.1",
    author: "siyam virus",
    countDown: 3,
    role: 2,
    shortDescription: "Cyber monitor and live monitor group activity",
    longDescription: "Monitors target group messages with strict 1-minute intervals and fixed stop commands.",
    category: "admin",
    guide: "monitor <tid> | stop <tid>"
  },

  onStart: async function () {},

  onChat: async function ({ api, event, message, usersData }) {
    const { body, threadID, senderID } = event;

    if (!body) return;
    const args = body.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    if (cmd === "monitor" && args[1]) {
      const targetTid = args[1];
      if (activeMonitors.has(targetTid)) {
        return message.reply(`⚠️ এই সিস্টেমটি ইতিমধ্যে মনিটরিংয়ে আছে! (TID: ${targetTid})\n\n__ BOSS SIYAM 🤩`);
      }

      let groupName = `Target Group [${targetTid}]`;
      try {
        const tInfo = await api.getThreadInfo(targetTid);
        if (tInfo && tInfo.threadName) {
          groupName = tInfo.threadName;
        }
      } catch (e) {
        try {
          const threadInfo = await global.utils.getThreadInfo(targetTid);
          if (threadInfo && threadInfo.threadName) groupName = threadInfo.threadName;
        } catch (err) {}
      }

      const monitorData = {
        adminTid: threadID,
        targetTid: targetTid,
        groupName: groupName,
        logs: [],
        interval: setInterval(async () => {
          const current = activeMonitors.get(targetTid);
          if (!current || current.logs.length === 0) return;

          const logsToSend = [...current.logs];
          current.logs = [];

          let box = `╔══════════════════════════╗\n`;
          box += `  𝗛𝗔͜͡𝗖𝗞𝗘𝗗 𝗕͜͡𝗬 𝗦𝗜⃟𝗬𝗔𝗠 𝗩𝗜͜͡𝗥𝗨𝗦☠️🚩\n`;
          box += `╚══════════════════════════╝\n\n`;
          box += `❯❯ 𝗧͟𝗛͟͠𝗘͟ 𝗚͟𝗥͟𝗢͟𝗨͟𝗣͟⚡🕸️ : ${current.groupName}\n`;
          box += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          box += logsToSend.join("\n");
          box += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          box += ` সিয়াম বস আপনি তো ভয়াবহ হামলা চালিয়েছেন তারা কি জানে ? 💀🚩\n\n`;
          box += `    -  𝗔͟𝗖͟𝗦͟ 𝗟͟𝗘͟𝗔͟𝗗͟𝗘͟𝗥͟ 𝗢͟𝗡͟ 𝗙͟𝗜͟𝗥͟𝗘͟ 👀🚩\n\n`;
          box += `__ BOSS SIYAM 🤩`;

          api.sendMessage(box, current.adminTid);
        }, 60000)
      };

      activeMonitors.set(targetTid, monitorData);

      let startBox = `╔══════════════════════════╗\n`;
      startBox += `  𝗛𝗔͜͡𝗖𝗞𝗘𝗗 𝗕͜͡𝗬 𝗦𝗜⃟𝗬𝗔𝗠 𝗩𝗜͜͡𝗥𝗨𝗦☠️🚩\n`;
      startBox += `╚══════════════════════════╝\n\n`;
      startBox += `❯❯ 𝗧͟𝗛͟͠𝗘͟ 𝗚͟𝗥͟𝗢͟𝗨͟𝗣͟⚡🕸️ : ${groupName}\n`;
      startBox += `𝗛𝗔͜͡𝗖𝗞𝗘𝗗 𝗕͜͡𝗬 𝗦𝗜⃟𝗬𝗔𝗠 𝗩𝗜͜͡𝗥𝗨𝗦☠️🚩\n\n`;
      startBox += ` সিয়াম বস আপনি তো ভয়াবহ হামলা চালিয়েছেন তারা কি জানে ? 💀🚩\n\n`;
      startBox += `    -  𝗔͟𝗖͟𝗦͟ 𝗟͟𝗘͟𝗔͟𝗗͟𝗘͟𝗥͟ 𝗢͟𝗡͟ 𝗙͟𝗜͟𝗥͟𝗘͟ 👀🚩\n\n`;
      startBox += `__ 🍷🚩`;

      return message.reply(startBox);
    }

    if (cmd === "stop" && args[1]) {
      const targetTid = args[1];
      if (!activeMonitors.has(targetTid)) {
        return message.reply(`❌ এই TID (${targetTid}) দিয়ে কোনো মনিটরিং চালু নেই।\n\n__ BOSS SIYAM 🤩`);
      }

      clearInterval(activeMonitors.get(targetTid).interval);
      activeMonitors.delete(targetTid);
      return message.reply("🍷👀\n\n__ BOSS SIYAM 🤩");
    }

    for (const [targetTid, monitor] of activeMonitors.entries()) {
      if (targetTid === threadID) {
        let senderName = "Hacker Target";
        try {
          senderName = await usersData.getName(senderID);
        } catch (e) {
          senderName = senderID;
        }

        const timeString = new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        let content = body ? body : "";
        if (event.attachments && event.attachments.length > 0) {
          const att = event.attachments[0];
          if (att.type === "sticker") {
            content = "[Sticker 🎨]";
          } else if (att.type === "photo") {
            content = "[Photo 🖼️]";
          } else if (att.type === "video") {
            content = "[Video 🎥]";
          } else if (att.type === "audio" || att.type === "voice_audio") {
            content = "[Voice Message 🎙️]";
          } else {
            content += content ? ` [${att.type}]` : `[${att.type}]`;
          }
        }

        if (content && !body.toLowerCase().startsWith("monitor") && !body.toLowerCase().startsWith("stop")) {
          monitor.logs.push(`┣ 🍷 ${senderName} ➔ "${content}"  [${timeString}]`);
        }
      }
    }
  },

  onEvent: async function ({ event }) {
    const { threadID, logMessageType, logMessageBody } = event;
    for (const [targetTid, monitor] of activeMonitors.entries()) {
      if (targetTid === threadID && logMessageType) {
        const timeString = new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
        const logText = logMessageBody ? logMessageBody : logMessageType;
        monitor.logs.push(`┣ ⚡ [Event] ${logText}  [${timeString}]`);
      }
    }
  }
};
