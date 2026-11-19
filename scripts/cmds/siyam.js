 const axios = require("axios");

const TRIGGERS = [
  "siyam",
  "shiam",
  "boss",
  "bos",
  "siyam koi",
  "siyam kothay",
  "siam",
  "shiam koi"
];

const DRIVE_FILE_ID = "1TMlHWnmN3pD0ZHEZb3xvsKcPAGK6_EJn";
const DIRECT_IMAGE_URL = `https://drive.google.com/uc?export=download&id=${DRIVE_FILE_ID}`;

const REPLY_TEXT = `    ╭•┄┅════❁🌺❁════┅┄•╮
কি হয়েছে রে বলদা আমার বস মিস্টার বিখ্যাত বিজ্ঞানী সিয়াম স্যারকে এত ডাকাডাকির কি হয়েছে 😼🪄

__ আমার বস এখন অনেক বিজি আছে বসের নাম মাইকিং করেও লাভ নাই 🍷👀😩 
✢━━━━━━━━━━━━━━━✢💫(✷‿✷)°🐹
যদি খুব বেশি প্রয়োজন হয় সরাসরি বসের এক্সপেরিমেন্ট রুম - Department of Law -তে চলে যাও বসের দেখা পেতে পারো 👀🚩
        ✢━━━━━━━━━━━━━━━✢
 বসের Number : 01940984562 কোনো মেয়েকে দিস না আবার 😩 তুই বসের সাক্ষাত পাওয়ার জন্য কান্নাকাটি করছিলি তাই তোকে গোপনে দিলাম 😻🍭
╭────────────♡彡 
╰➤😻🍭𝘾 𝙀 𝙊  ⸙Sɪʏꫝᴍ  !`;

function hasTriggerWord(text = "") {
  const lower = text.toLowerCase().trim();
  if (!lower) return false;

  return TRIGGERS.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escaped}($|\\s|[^a-zA-Z0-9])`, "i");
    return regex.test(lower);
  });
}

module.exports = {
  config: {
    name: "siyam",
    version: "1.0",
    author: "সিয়াম",
    role: 0,
    category: "fun",
    guide: "siyam"
  },

  onStart: async function ({ message }) {
    await sendSiyamReply(message);
  },

  onChat: async function ({ message, event }) {
    if (!event?.body) return;
    if (!hasTriggerWord(event.body)) return;
    await sendSiyamReply(message);
  }
};

async function sendSiyamReply(message) {
  let attachment = null;

  try {
    if (global.utils && typeof global.utils.getStreamFromUrl === "function") {
      attachment = await global.utils.getStreamFromUrl(DIRECT_IMAGE_URL);
    } else {
      const response = await axios.get(DIRECT_IMAGE_URL, { responseType: "stream" });
      attachment = response.data;
    }
  } catch (e) {
    attachment = null;
  }

  const payload = attachment ? { body: REPLY_TEXT, attachment } : { body: REPLY_TEXT };
  return message.reply(payload);
}
