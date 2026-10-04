const fs = require("fs");

module.exports = {
    config: {
        name: "npx22",
        version: "1.0",
        author: "Mesbah Saxzx",
        countDown: 5,
        role: 0,
        description: {
            en: "Auto play audio when trigger emojis are detected"
        },
        category: "no prefix",
        guide: {
            en: "Only trigger emoji will send voice"
        }
    },

    onChat: async function ({ api, event }) {
        const { threadID, messageID, body } = event;
        if (!body) return;

        // Remove spaces
        const text = body.replace(/\s+/g, "");

        // Trigger emojis
        const triggers = ["😒", "😒", "😒", "😒", "🥱"];

        // Check if message is exactly one of the triggers
        if (triggers.includes(text)) {

            const filePath = __dirname + "\siyam\siyamvirus.mp3";

            api.sendMessage({
                body: "siyam's wifee💚🫣",
                attachment: fs.createReadStream(filePath)
            }, threadID, messageID);

            api.setMessageReaction("💋", messageID, () => {}, true);
        }
    },

    onStart: async function () {}
};
