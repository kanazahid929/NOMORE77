const { getTime } = global.utils;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "3.0",
        author: "MD SIYAM OFFICIAL",
        category: "events"
    },

    langs: {
        en: {
            session1: "morning",
            session2: "noon",
            session3: "afternoon",
            session4: "evening",
            welcomeMessage: "‎𝘽𝙊𝙏 𝘾𝙊𝙉𝙉𝙀𝘾𝙏𝙀𝘿 𝙎𝙐𝘾𝙎𝙀𝙎𝙎𝙁𝙐𝙇𝙇🏴‍☠️📌\n\n𝗟𝗢𝗔𝗗𝗜𝗡𝗚 ...👾🔥😈\n\n📌👀 Bot Activated ⚡"
        }
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {

        if (event.logMessageType !== "log:subscribe") return;

        return async function () {
            const { threadID } = event;
            const added = event.logMessageData.addedParticipants;

            // 🔥 BOT ADD
            if (added.some(p => p.userFbId == api.getCurrentUserID())) {

                api.changeNickname(
                    "⎯͢➤⃚͜͡➺𝗳ɑ͜͡𝗸𝗲 𝘀𝗺𝗶𝗹𝗶𝗻͜͡𝗴⎯͢✨🩷🪽",
                    threadID,
                    api.getCurrentUserID()
                );

                // ✅ FIXED BOT VIDEO
                const botAddVideo = "https://drive.google.com/uc?id=1rBczX9su4fDd1jtaT6_YyocwwFqzk6WF";
                const videoPath = path.join(__dirname, "bot_add.mp4");

                if (!fs.existsSync(videoPath)) {
                    try {
                        const file = await axios.get(botAddVideo, {
                            responseType: "arraybuffer"
                        });
                        fs.writeFileSync(videoPath, file.data);
                    } catch (err) {
                        console.log("Bot video download failed:", err.message);
                    }
                }

                return message.send({
                    body: getLang("welcomeMessage"),
                    attachment: fs.createReadStream(videoPath)
                });
            }

            // 🔥 MEMBER ADD
            if (!global.temp.welcomeEvent[threadID])
                global.temp.welcomeEvent[threadID] = {
                    joinTimeout: null,
                    dataAddedParticipants: []
                };

            global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...added);
            clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

            global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {

                const threadInfo = await threadsData.get(threadID);
                if (threadInfo.settings.sendWelcomeMessage === false) return;

                const newUsers = global.temp.welcomeEvent[threadID].dataAddedParticipants;

                const names = [];
                const mentions = [];

                for (const u of newUsers) {
                    names.push(u.fullName);
                    mentions.push({ tag: u.fullName, id: u.userFbId });
                }

                if (!names.length) return;

                let welcomeMsg = threadInfo.data.welcomeMessage || getLang("defaultWelcomeMessage");
                const multi = names.length > 1;

                welcomeMsg = welcomeMsg
                    .replace(/\{userName\}/g, names.join(", "))
                    .replace(/\{boxName\}|\{threadName\}/g, threadInfo.threadName)
                    .replace(/\{multiple\}/g, multi ? "আপনারা" : "আপনি");

                // ✅ MEMBER VIDEO FIXED
                const memberVideo = "https://drive.google.com/uc?id=1XX4YGkqIpgocvMOEz_CbHI5XFvDSptVw";
                const videoPath = path.join(__dirname, "member_add.mp4");

                if (!fs.existsSync(videoPath)) {
                    try {
                        const file = await axios.get(memberVideo, {
                            responseType: "arraybuffer"
                        });
                        fs.writeFileSync(videoPath, file.data);
                    } catch (err) {
                        console.log("Member video download failed:", err.message);
                    }
                }

                message.send({
                    body: welcomeMsg,
                    attachment: fs.createReadStream(videoPath),
                    mentions
                });

                delete global.temp.welcomeEvent[threadID];

            }, 1500);
        };
    }
};
