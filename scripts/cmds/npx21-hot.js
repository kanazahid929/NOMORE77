const fs = require("fs");

module.exports = {
    config: {
        name: "npx21",
        version: "1.2",
        author: "siyamssd1",
        countDown: 5,
        role: 2,
        description: {
            en: "Auto play audio when specific text or emoji triggers are detected"
        },
        category: "no prefix",
        guide: {
            en: "Type Siyam3, King3, or send 😁 to trigger the voice"
        }
    },

    onChat: async function ({ api, event }) {
        const { threadID, messageID, body } = event;
        if (!body) return;

        // Prepare the message body for checking (remove spaces, convert to lowercase for text)
        const text = body.trim().toLowerCase();
        const originalBody = body.trim(); // Keep original for emoji check

        // Trigger keywords (text-based)
        const textTriggers = ["siyam3", "king3"];
        // Trigger emoji
        const emojiTrigger = "😁";

        // Check if the message matches ANY of the triggers
        if (textTriggers.includes(text) || originalBody === emojiTrigger) {

            const filePath = __dirname + "/siyam/siyam3.mp3";

            // Check if file exists to prevent errors
            if (fs.existsSync(filePath)) {
                api.sendMessage({
                    body: "😻🍭𝐂𝐄𝐎⸙𝐒𝐄𝐘𝐀𝐌𓆪🍥🧸",
                    attachment: fs.createReadStream(filePath)
                }, threadID, messageID);

                api.setMessageReaction("👀", messageID, () => {}, true);
            } else {
                console.error("Error: Audio file not found at " + filePath);
                api.sendMessage("..... siyam boss api 729।", threadID, messageID);
            }
        }
    },

    onStart: async function () {}
};
