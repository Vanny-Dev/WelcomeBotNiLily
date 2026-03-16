/**
 * preview.js — Test the welcome card without running the bot.
 * Usage:  node preview.js
 * Output: preview.png
 */

const { generateWelcomeCard } = require("./welcomeCard");
const { updateGuildSettings } = require("./storage");
const fs = require("fs");

// You can tweak these to test different text settings
const PREVIEW_GUILD_ID = "preview";
updateGuildSettings(PREVIEW_GUILD_ID, {
  title:        "WELCOME TO THE SERVER",
  subtitle:     "We've been expecting you.",
  greetingLine: "Hey {username}, glad you're here!",
  bodyText:     "You are now part of something special.\\nIntroduce yourself and make yourself at home.",
  footer:       "Read the rules • Pick your roles • Have fun",
  // backgroundPath: "/path/to/local/image.png",  // uncomment to test custom bg
});

const mockMember = {
  user: {
    id: "123456789012345678",
    username: "CoolUser",
    tag: "CoolUser#0000",
    discriminator: "0",
    displayAvatarURL: () => "https://cdn.discordapp.com/embed/avatars/4.png",
  },
  guild: {
    id: PREVIEW_GUILD_ID,
    name: "Awesome Server",
    memberCount: 1337,
    iconURL: () => null,
  },
  joinedTimestamp: Date.now(),
};

(async () => {
  console.log("Generating welcome card preview...");
  try {
    const buffer = await generateWelcomeCard(mockMember);
    fs.writeFileSync("preview.png", buffer);
    console.log("✓ Saved to preview.png");
  } catch (err) {
    console.error("Error:", err);
  }
})();