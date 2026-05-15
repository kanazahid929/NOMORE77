const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "info",
    author: "Tokodori",
    role: 0,
    shortDescription: "Displays admin info",
    longDescription: "Shows info about the bot owner/admin",
    category: "admin",
    guide: "{pn}"
  },

  onStart: async () => {},

  onChat: async function ({ api, event }) {
    try {
      // NO PREFIX TRIGGER
      if (event.body?.toLowerCase() !== "info") return;

      const imageUrl = "https://drive.google.com/file/d/1k4_a-Tt2rCLw66h0iZRNSJ2kyBmyorwe/view?usp=drivesdk";
      const imgPath = path.join(__dirname, "info.jpg");

      // Download image and save
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, Buffer.from(response.data));

      const message = `
╭─━━━❖🫧❖━━━─╮
👾 𝗩͟𝗜͟͠𝗥𝗨𝗦  𝗔͟𝗟͟͠𝗘𝗥𝗧
╰─━━━❖🫧❖━━━─╯

- 𝗡𝗔͜͡𝗠𝗘       :    - 𝗦𝗜͜͡𝗬𝗔𝗠  🎭
- 𝗚𝗘͜͡𝗡𝗗𝗘𝗥        : -𝗠𝗔͜͡𝗟𝗘  ⚡       
- 𝗥𝗘͜͡𝗟𝗔𝗧𝗜𝗢𝗡𝗦𝗛𝗜𝗣 :  - 𝗦𝗜͜͡𝗡𝗚𝗟𝗘  🪄  
🍷 𝗔͜͡𝗚𝗘            : 𝟭𝟵  🥂  
💝 𝗥𝗘͜͡𝗟𝗜𝗚𝗜𝗢𝗡 : 𝗜𝗦͜͡𝗟𝗔𝗠  
   𝗔͜͡𝗗𝗗𝗥𝗘𝗦𝗦       : 𝗦𝗔͜͡𝗧𝗞𝗛𝗜𝗥𝗔  🍷☠️  
 - 𝗙𝗔͜͡𝗖𝗘𝗕𝗢𝗢𝗞  : 🪄https://www.facebook.com/100000491671361

🎯🪄⚡

👾 𝗧𝗜͜͡𝗧𝗟𝗘 : 𝗕𝗜𝗥𝗧𝗛 𝗙𝗔͜͡𝗧𝗛𝗘𝗥 𝗢𝗙 𝗡𝗢𝗕𝗜𝗡🍷
📩 𝗙𝗔͜͡𝗩𝗢𝗥𝗜𝗧𝗘 𝗪𝗢𝗥𝗗 : 𝗘𝗥𝗢͜͡𝗢𝗥   📨🥂
🎭 𝗠𝗢͜͡𝗗𝗘  : 𝗗𝗔𝗥𝗞 | 𝗛𝗜͜͡𝗗𝗗𝗘𝗡 | 𝗙𝗢𝗖𝗨𝗦𝗘𝗗  ☠️  
🧠 𝗖𝗢͜͡𝗠𝗠𝗔𝗡𝗗𝗦 :  𝟰𝟰𝟰☠️
👑 𝗦𝗢͜͡𝗠𝗘𝗧𝗛𝗜𝗡𝗚 𝗘𝗟𝗦𝗘   : 🍷👑

───────────────────────────`;

      await api.sendMessage(
        {
          body: message,
          attachment: await global.utils.getStreamFromURL("https://drive.google.com/uc?id=1k4_a-Tt2rCLw66h0iZRNSJ2kyBmyorwe")
        },
        event.threadID,
        event.messageID
      );

      // React on trigger message
      api.setMessageReaction("🖤", event.messageID, () => {}, true);

    } catch (e) {
      console.error(e);
      api.sendMessage("Something went wrong!", event.threadID);
    }
  }
};
