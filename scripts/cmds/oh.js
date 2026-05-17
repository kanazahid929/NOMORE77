const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "oh",
		version: "1.0",
		author: "siyam8881",
		countDown: 5,
		role: 1,
		shortDescription: "sarcasm",
		longDescription: "Responds with random media when someone says 'oh",
		category: "reply",
	},

	onStart: async function () {},

	onChat: async function ({ event, message }) {
		if (event.body && event.body.toLowerCase() === "oh") {

			const mediaLinks = [
				"https://drive.google.com/uc?id=1DTPkROhFC_DRBHv3ngSqmoERh_8sqqlo",
				"https://drive.google.com/uc?id=1eeRTnKPtDgcBIrC0IIXWFdhubXtDzOdM",
				"https://drive.google.com/uc?id=1T3cac6FE3qvsC1DxHo5skvewDIGroUIH"
			];

			const randomLink = mediaLinks[Math.floor(Math.random() * mediaLinks.length)];
			const filePath = path.join(__dirname, "oh.mp4");

			try {
				const response = await axios.get(randomLink, {
					responseType: "arraybuffer"
				});

				fs.writeFileSync(filePath, response.data);

				await message.reply({
					body: "-!X-z⁶²M?\n\n々𝗪͜͡𝗛𝗢 -? 🎭👑\n\n\n\n- 々—͟͞͞Mʀ⸙Sɪʏꫝᴍ 𝗩𝗜𝗥𝗨𝗦🚩🏴‍☠️📨\n\n____________☠️⚡",
					attachment: fs.createReadStream(filePath)
				});

			} catch (err) {
				console.error("Failed to fetch media:", err.message);
				await message.reply("Sorry, couldn't load the media.");
			} finally {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}
		}
	}
};
