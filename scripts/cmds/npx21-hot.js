const fs = require("fs");

module.exports = {
    config: {
        name: "npx21",
        version: "1.1",
        author: "siyamssd1",
        countDown: 5,
        role: 0,
        description: {
            en: "Auto play audio when specific text triggers are detected"
        },
        category: "no prefix",
        guide: {
            en: "Type Siyam3 or King3 to send voice"
        }
    },

    onChat: async function ({ api, event }) {
        const { threadID, messageID, body } = event;
        if (!body) return;

        // Convert message to lowercase to avoid case-sensitivity issues (e.g. siyam3 or SIYAM3)
        const text = body.trim().toLowerCase();

        // Trigger keywords
        const triggers = ["siyam3", "king3"];

        // Check if the message matches the triggers
        if (triggers.includes(text)) {

            const filePath = __dirname + "/siyam/siyam3.mp3";

            api.sendMessage({
                body: "😻🍭𝐂𝐄𝐎⸙𝐒𝐄𝐘𝐀𝐌𓆪🍥🧸",
                attachment: fs.createReadStream(filePath)
            }, threadID, messageID);

            api.setMessageReaction("👅", messageID, () => {}, true);
        }
    },

    onStart: async function () {}
};
