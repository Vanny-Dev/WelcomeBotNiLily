// ╔══════════════════════════════════════════╗
// ║     WELCOME BOT CONFIGURATION            ║
// ║  Edit everything here — no code needed!  ║
// ╚══════════════════════════════════════════╝
require("dotenv").config();

module.exports = {
  // ─── Bot Settings ───────────────────────────────────
  token: process.env.TOKEN,
  welcomeChannelId: "1482275037649305761",

  // For instant slash command registration during development.
  // Set this to your server/guild ID. Leave "" for global registration (takes ~1 hour).
  guildId: "1194284869455462450",

  // ─── Role Permissions ────────────────────────────────
  // Only members with ONE of these two role IDs can use the bot's slash commands.
  // Right-click a role in Discord → Copy Role ID (Developer Mode must be on).
  allowedRoleIds: [
    "1482961169949003837"
  ],

// ─── Welcome Message Text ───────────────────────────
  message: {
    title: "WELCOME TO THE SERVER",
    subtitle: "We've been expecting you.",
    bodyText: "You are now part of something special.\nIntroduce yourself and make yourself at home.",
    footer: "Read the rules • Pick your roles • Have fun",
 
    // Dynamic tags you can use: {username}, {tag}, {memberCount}, {serverName}
    greetingLine: "Hey {username}, glad you're here!",
  },
 
  // ─── Font Sizes ──────────────────────────────────────────────────────────────
  // All values are in pixels. Max recommended: 50. Min recommended: 10.
  // The font used is League Spartan (Bold / Regular / Light).
  fonts: {
    title:    20,   // small spaced-out label at the top
    greeting: 45,   // large bold welcome line  ← try up to 50
    subtitle: 20,   // lighter line below greeting
    body:     18,   // description paragraph
    footer:   12,   // tiny text at the bottom
    badge:    20,   // username badge under the avatar
  },
 
 
  canvas: {
    width: 900,
    height: 300,
 
    // Background gradient colors
    bgGradientStart: "#0a0000",
    bgGradientEnd: "#2d0800",
 
    // Accent color (used for glow, borders, highlights)
    accentColor: "#ff6a00",
    accentColorAlt: "#ff2200",
 
    // Text colors
    titleColor: "#ffffff",
    subtitleColor: "#ffffff", //#ffaa40


    bodyColor: "#ffd0a0",
    greetingColor: "#fff0d0",
 
    // Avatar — centered in the left column (column width = 215px, center = 107)
    avatarSize: 110,
    avatarX: 107,       // center of the 215px left column
    avatarY: 75,        // top of avatar so it sits vertically centered in 300px
    avatarBorderColor: "#ff6a00",
    avatarBorderWidth: 5,
    avatarGlowColor: "rgba(255, 106, 0, 0.5)",
 
    // Decorative particle count
    particleCount: 60,
  },
 
  // ─── Embed Settings (sent alongside the image) ───────
  embed: {
    enabled: true,
    color: 0xff6a00,
    showMemberCount: true,
    showJoinDate: true,
 
    // Set channel IDs or leave "" to skip
    rulesChannelId: "",
    rolesChannelId: "",
  },
 
  // ─── DM Welcome (optional) ───────────────────────────
  dm: {
    enabled: false,
    message: "Welcome to the server! Check the rules and enjoy your stay.",
  },
};