/**
 * backgroundManager.js
 * Downloads and caches custom background images/GIFs per guild.
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");
const http  = require("http");

const BG_DIR = path.join(__dirname, "backgrounds");
if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });

/**
 * Download a background image URL and save it locally.
 * Returns the local file path.
 */
function downloadBackground(url, guildId) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const ext    = (parsed.pathname.match(/\.(gif|png|jpg|jpeg|webp)$/i) || ["", ".png"])[1];
    const dest   = path.join(BG_DIR, `${guildId}${ext}`);

    // Remove any old bg for this guild first
    const existing = fs.readdirSync(BG_DIR).filter(f => f.startsWith(guildId));
    existing.forEach(f => { try { fs.unlinkSync(path.join(BG_DIR, f)); } catch {} });

    const proto = parsed.protocol === "https:" ? https : http;

    const req = proto.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow single redirect
        return downloadBackground(res.headers.location, guildId).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const contentType = res.headers["content-type"] || "";
      if (!contentType.startsWith("image/")) {
        return reject(new Error(`URL did not return an image (got ${contentType})`));
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(dest); });
      file.on("error",  (err) => { fs.unlink(dest, () => {}); reject(err); });
    });

    req.on("error",   reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Download timed out")); });
  });
}

/**
 * Get the local cached background path for a guild, or null if none exists.
 */
function getCachedBackground(guildId) {
  if (!guildId) return null;
  try {
    const files = fs.readdirSync(BG_DIR).filter(f => f.startsWith(guildId));
    if (files.length) return path.join(BG_DIR, files[0]);
  } catch {}
  return null;
}

module.exports = { downloadBackground, getCachedBackground };