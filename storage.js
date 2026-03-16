/**
 * storage.js — Persistent per-guild settings stored in a JSON file.
 * No database needed. All settings survive bot restarts.
 */

const fs   = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "guild_settings.json");

/** Load all settings from disk */
function loadAll() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch {}
  return {};
}

/** Save all settings to disk */
function saveAll(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

/** Get settings for a specific guild, with defaults merged in */
function getGuildSettings(guildId) {
  const all = loadAll();
  const defaults = {
    title:        "WELCOME TO THE SERVER",
    subtitle:     "We've been expecting you.",
    greetingLine: "Hey {username}, glad you're here!",
    bodyText:     "You are now part of something special.\nIntroduce yourself and make yourself at home.",
    footer:       "Read the rules • Pick your roles • Have fun",
    backgroundUrl: null,   // URL to custom bg image/gif (null = use fire theme)
    backgroundPath: null,  // Local cached path of the downloaded bg
  };
  return Object.assign({}, defaults, all[guildId] || {});
}

/** Update one or more keys for a guild */
function updateGuildSettings(guildId, updates) {
  const all  = loadAll();
  all[guildId] = Object.assign(getGuildSettings(guildId), updates);
  saveAll(all);
  return all[guildId];
}

module.exports = { getGuildSettings, updateGuildSettings };