const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "ff",
		version: "1.0",
		author: "siyam887781",
		countDown: 5,
		role: 0,
		shortDescription: "sarcasm",
		longDescription: "Responds with random media when someone says ff",
		category: "reply",
	},

	onStart: async function () {},

	onChat: async function ({ event, message }) {
		if (event.body && event.body.toLowerCase() === "ff") {
			const mediaLinks = [
				"https://drive.google.com/uc?id=1eeRTnKPtDgcBIrC0IIXWFdhubXtDzOdM"
			];

			const randomLink = mediaLinks[Math.floor(Math.random() * mediaLinks.length)];
			const filePath = path.join(__dirname, "ff.mp4");

			try {
				const response = await axios.get(randomLink, {
					responseType: "arraybuffer"
				});

				fs.writeFileSync(filePath, response.data);

				await message.reply({
					body: "✨🖤 𝙈𝙔 𝙂𝘼𝙈𝙀 𝙐𝙄𝘿 👀🍫 :–2732681410\n\n𝙄𝙩'𝙨 𝙝𝙖𝙘𝙠𝙚𝙧 𝙪𝙣𝙞𝙩𝙮 👀🪄❗– 𝙒𝙝𝙤 𝙄 𝙖𝙢, 𝙮𝙤𝙪 𝙝𝙖𝙫𝙚 𝙣𝙤 𝙞𝙙𝙚𝙖 🖇️💚🚩\n\n𝘿𝙤𝙣'𝙩 𝙞𝙣𝙫𝙞𝙩𝙚 𝙢𝙚 𝙘𝙪𝙨𝙩𝙤𝙢 🚩\n\n🖤👀✨",
					attachment: fs.createReadStream(filePath)
				});

			} catch (err) {
				console.error("Failed to fetch media:", err.message);
				await message.reply("Media load failed.");
			} finally {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}
		}
	}
};
