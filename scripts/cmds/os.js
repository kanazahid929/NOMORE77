const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "os",
		version: "1.0",
		author: "siyam8881",
		countDown: 5,
		role: 2,
		shortDescription: "sarcasm",
		longDescription: "Responds with random media when someone says 'acs",
		category: "reply",
	},

	onStart: async function () {},

	onChat: async function ({ event, message }) {
		if (event.body && event.body.toLowerCase() === "os") {
			const mediaLinks = [
				"https://drive.google.com/file/d/1ed3BJ5v4bM5ImyznQcwu2OQl3funlebo/view?usp=drive_link",
				"https://drive.google.com/file/d/1FObZqOdyJK0_SgXsXANTMrVfwSdy6ZMZ/view?usp=drive_link",
				"https://drive.google.com/file/d/13A3Q6By8bd41kz_I8WfCJ3c7GvZvNuQP/view?usp=drive_link",
				"https://drive.google.com/file/d/1jHKHvioZc4zNYAqsDwEsD5E-tSGKGTPw/view?usp=drive_link",
				"https://drive.google.com/file/d/1cCJj9AXgHtQ_3aiyAIdynWm1UZyvhi68/view?usp=drive_link",
				"https://drive.google.com/file/d/1xn5BEaDMjiayeCyFzRCB--ZPqvNvSA6n/view?usp=drive_link",
				"https://drive.google.com/file/d/1jHKHvioZc4zNYAqsDwEsD5E-tSGKGTPw/view?usp=drive_link",
				"https://drive.google.com/file/d/1FObZqOdyJK0_SgXsXANTMrVfwSdy6ZMZ/view?usp=drive_link",
				"https://drive.google.com/file/d/1FObZqOdyJK0_SgXsXANTMrVfwSdy6ZMZ/view?usp=drive_link",
				"https://drive.google.com/file/d/1FObZqOdyJK0_SgXsXANTMrVfwSdy6ZMZ/view?usp=drive_link"
			];

			const randomLink = mediaLinks[Math.floor(Math.random() * mediaLinks.length)];
			const fileName = path.basename(randomLink);
			const filePath = path.join(__dirname, fileName);

			try {
				const response = await axios.get(randomLink, { responseType: "arraybuffer" });
				fs.writeFileSync(filePath, Buffer.from(response.data));

				await message.reply({
					body: "-!X-z⁶²M?\n\n々𝗪͜͡𝗛𝗢 -?  🎭👑\n\n\n\n- 々𝗦𝗜𝗬͜͡⁴𝗠 𝗩𝗜𝗥𝗨𝗦🚩🏴‍☠️📨\n\n____________☠️⚡",
					attachment: fs.createReadStream(filePath)
				});
			} catch (err) {
				console.error("Failed to fetch media:", err.message);
				await message.reply("Sorry, couldn't load the media.");
			} finally {
				fs.unlink(filePath, () => {});
			}
		}
	}
};
