const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const fs   = require("fs");
const path = require("path");
const config = require("./config");
const { getGuildSettings } = require("./storage");
const { getCachedBackground } = require("./backgroundManager");

// ─── Register League Spartan fonts ───────────────────────────────────────────
const FONTS_DIR = path.join(__dirname, "fonts");
GlobalFonts.registerFromPath(path.join(FONTS_DIR, "LeagueSpartan-Bold.otf"),    "LeagueSpartan");
GlobalFonts.registerFromPath(path.join(FONTS_DIR, "LeagueSpartan-Regular.otf"), "LeagueSpartan");
GlobalFonts.registerFromPath(path.join(FONTS_DIR, "LeagueSpartan-Light.otf"),   "LeagueSpartan");

const F = {
  bold:    (size) => `bold ${size}px LeagueSpartan`,
  regular: (size) => `${size}px LeagueSpartan`,
  light:   (size) => `300 ${size}px LeagueSpartan`,
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Fire Background (default) ────────────────────────────────────────────────

function drawFlame(ctx, cx, baseY, flameH, flameW, colorInner, colorOuter) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - flameW / 2, baseY);
  ctx.bezierCurveTo(cx - flameW * 0.6, baseY - flameH * 0.4, cx - flameW * 0.2, baseY - flameH * 0.7, cx, baseY - flameH);
  ctx.bezierCurveTo(cx + flameW * 0.2, baseY - flameH * 0.7, cx + flameW * 0.6, baseY - flameH * 0.4, cx + flameW / 2, baseY);
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx, baseY - flameH * 0.3, 2, cx, baseY - flameH * 0.3, flameH * 0.85);
  grad.addColorStop(0, colorInner);
  grad.addColorStop(0.5, colorOuter);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.restore();
}

function drawFireBackground(ctx, width, height) {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, "#0a0000");
  base.addColorStop(0.4, "#1a0500");
  base.addColorStop(1, "#2d0800");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const lava = ctx.createLinearGradient(0, height * 0.65, 0, height);
  lava.addColorStop(0, "rgba(0,0,0,0)");
  lava.addColorStop(0.5, "rgba(180,40,0,0.35)");
  lava.addColorStop(1, "rgba(255,100,0,0.55)");
  ctx.fillStyle = lava;
  ctx.fillRect(0, 0, width, height);

  [
    { cx: 60, h: 200, w: 80 }, { cx: 160, h: 260, w: 100 },
    { cx: 280, h: 190, w: 75 }, { cx: 400, h: 300, w: 120 },
    { cx: 520, h: 220, w: 90 }, { cx: 650, h: 280, w: 110 },
    { cx: 760, h: 200, w: 80 }, { cx: 860, h: 250, w: 95 },
    { cx: 950, h: 170, w: 70 },
  ].forEach(({ cx, h, w }) =>
    drawFlame(ctx, cx, height + 10, h, w, "rgba(255,220,80,0.9)", "rgba(255,60,0,0.6)")
  );

  const r2 = seededRandom(13);
  for (let i = 0; i < 14; i++)
    drawFlame(ctx, r2() * width, height + 5, 60 + r2() * 100, 30 + r2() * 50, "rgba(255,160,20,0.6)", "rgba(200,30,0,0.3)");

  const re = seededRandom(77);
  for (let i = 0; i < 120; i++) {
    const x = re() * width, y = height - re() * height * 0.85;
    const t = re();
    const color = t < 0.3 ? `rgba(255,255,220,${re() * 0.7 + 0.2})` : t < 0.6 ? `rgba(255,180,40,${re() * 0.7 + 0.2})` : `rgba(255,80,10,${re() * 0.7 + 0.2})`;
    ctx.beginPath(); ctx.arc(x, y, re() * 2.2 + 0.4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }

  const smoke = ctx.createLinearGradient(0, 0, 0, height * 0.45);
  smoke.addColorStop(0, "rgba(20,8,0,0.55)");
  smoke.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = smoke;
  ctx.fillRect(0, 0, width, height);

  const rn = seededRandom(42);
  for (let i = 0; i < 3500; i++) {
    ctx.fillStyle = `rgba(255,100,0,${rn() * 0.045})`;
    ctx.fillRect(rn() * width, rn() * height, 1, 1);
  }
}

// ─── Custom Image Background ───────────────────────────────────────────────────

async function drawCustomBackground(ctx, bgPath, width, height) {
  try {
    const img = await loadImage(bgPath);
    const scale = Math.max(width / img.width, height / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    const sx = (width - sw) / 2, sy = (height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh);
    const overlay = ctx.createLinearGradient(0, 0, 0, height);
    overlay.addColorStop(0, "rgba(0,0,0,0.45)");
    overlay.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);
  } catch (err) {
    console.warn("[welcomeCard] Could not load custom bg, falling back to fire:", err.message);
    drawFireBackground(ctx, width, height);
  }
}

// ─── Fire Particles ───────────────────────────────────────────────────────────

function drawParticles(ctx, width, height, userId) {
  const rand = seededRandom(parseInt(userId || "12345", 10) % 99999);
  const count = config.canvas.particleCount || 50;
  const colors = ["255,255,200", "255,220,60", "255,140,20", "255,60,0", "200,20,0"];
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = height * 0.3 + rand() * height * 0.7;
    const r = rand() * 3 + 0.5;
    const a = rand() * 0.75 + 0.15;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colors[Math.floor(rand() * colors.length)]},${a.toFixed(2)})`;
    ctx.fill();
    if (r > 2) {
      ctx.beginPath();
      ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,120,0,${(a * 0.15).toFixed(2)})`;
      ctx.fill();
    }
  }
}

// ─── Card Frame ───────────────────────────────────────────────────────────────

function drawCardFrame(ctx, width, height) {
  const margin = 12, len = 32;
  const positions = [
    [margin, margin, 1, 1],
    [width - margin, margin, -1, 1],
    [margin, height - margin, 1, -1],
    [width - margin, height - margin, -1, -1],
  ];

  const borderGrad = ctx.createLinearGradient(0, 0, width, height);
  borderGrad.addColorStop(0, "rgba(255,60,0,0.5)");
  borderGrad.addColorStop(0.5, "rgba(255,180,40,0.4)");
  borderGrad.addColorStop(1, "rgba(255,60,0,0.5)");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 1;
  roundRect(ctx, margin, margin, width - margin * 2, height - margin * 2, 4);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,100,0,0.25)";
  ctx.lineWidth = 6;
  positions.forEach(([x, y, dx, dy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + dy * len); ctx.lineTo(x, y); ctx.lineTo(x + dx * len, y); ctx.stroke();
  });

  const cg = ctx.createLinearGradient(0, 0, width, height);
  cg.addColorStop(0, "#ff6a00"); cg.addColorStop(0.5, "#ffcc40"); cg.addColorStop(1, "#ff3300");
  ctx.strokeStyle = cg;
  ctx.lineWidth = 2.5;
  positions.forEach(([x, y, dx, dy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + dy * len); ctx.lineTo(x, y); ctx.lineTo(x + dx * len, y); ctx.stroke();
  });
}

// ─── Divider ─────────────────────────────────────────────────────────────────
// x must match dividerX in drawTextContent

function drawAccentLines(ctx) {
  const x = 215;  // ← keep in sync with dividerX in drawTextContent
  const lg = ctx.createLinearGradient(x, 60, x, 260);
  lg.addColorStop(0, "rgba(255,60,0,0)");
  lg.addColorStop(0.2, "rgba(255,120,20,0.7)");
  lg.addColorStop(0.5, "rgba(255,200,60,0.9)");
  lg.addColorStop(0.8, "rgba(255,120,20,0.7)");
  lg.addColorStop(1, "rgba(255,60,0,0)");
  ctx.strokeStyle = lg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 260); ctx.stroke();
  ctx.strokeStyle = "rgba(255,100,0,0.15)"; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 250); ctx.stroke();
  [[x, 65], [x, 255]].forEach(([fx, fy]) => {
    ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fillStyle = "#ffcc40"; ctx.fill();
    ctx.beginPath(); ctx.arc(fx, fy, 7, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,120,0,0.3)"; ctx.fill();
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

async function drawAvatar(ctx, avatarUrl, cfg) {
  const { avatarX, avatarY, avatarSize, avatarBorderColor, avatarBorderWidth } = cfg;
  const cx = avatarX, cy = avatarY + avatarSize / 2, r = avatarSize / 2;

  for (let i = 3; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + avatarBorderWidth + i * 6, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(avatarBorderColor, 0.08 * (4 - i));
    ctx.lineWidth = 8;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r + avatarBorderWidth, 0, Math.PI * 2);
  ctx.strokeStyle = avatarBorderColor;
  ctx.lineWidth = avatarBorderWidth;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  try {
    const img = await loadImage(avatarUrl + "?size=256");
    ctx.drawImage(img, cx - r, cy - r, avatarSize, avatarSize);
  } catch {
    const fb = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    fb.addColorStop(0, cfg.accentColor); fb.addColorStop(1, cfg.accentColorAlt);
    ctx.fillStyle = fb; ctx.fillRect(cx - r, cy - r, avatarSize, avatarSize);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(cx, cy - 15, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy + 30, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ─── Text Content ─────────────────────────────────────────────────────────────

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawTextContent(ctx, member, cfg, settings, fs) {
  const W = cfg.width  || 900;
  const H = cfg.height || 300;

  // ── Zone boundaries ───────────────────────────────────────────────────────
  // dividerX = width of the left avatar column
  // rightL   = where the right text panel starts (dividerX + gap)
  // NOTE: drawAccentLines uses the same dividerX — keep them in sync
  const dividerX = 215;
  const rightL   = 235;
  const rightR   = W - 25;
  const rightW   = rightR - rightL;
  const rightCX  = rightL + rightW / 2;

  // ── Tag replacer ──────────────────────────────────────────────────────────
  const tags = (str) => (str || "")
    .replace(/{username}/g,    member.user.username)
    .replace(/{tag}/g,         member.user.tag)
    .replace(/{memberCount}/g, member.guild.memberCount)
    .replace(/{serverName}/g,  member.guild.name);

  // ════════════════════════════════════════════════════════════════════════
  // LEFT COLUMN — username badge pinned to bottom-center of the column
  // ════════════════════════════════════════════════════════════════════════
  const leftCX  = dividerX / 2;
  const username = member.user.username;

  ctx.font = F.bold(fs.badge);
  const tw = ctx.measureText(username).width;
  const bw = tw + 28;
  const bh = fs.badge + 14;
  const bx = leftCX - bw / 2;
  const by = H - bh - 60;

  // Glow behind badge
  ctx.save();
  ctx.shadowColor = cfg.accentColor;
  ctx.shadowBlur  = 12;
  const bb = ctx.createLinearGradient(bx, by, bx + bw, by);
  bb.addColorStop(0, hexToRgba(cfg.accentColor,    0.45));
  bb.addColorStop(1, hexToRgba(cfg.accentColorAlt, 0.25));
  ctx.fillStyle = bb;
  roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
  ctx.restore();

  ctx.strokeStyle = hexToRgba(cfg.accentColor, 0.75);
  ctx.lineWidth   = 1.5;
  roundRect(ctx, bx, by, bw, bh, 8); ctx.stroke();

  ctx.textAlign = "center";
  ctx.font      = F.bold(fs.badge);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(username, leftCX, by + bh - Math.round(bh * 0.28));

  // ════════════════════════════════════════════════════════════════════════
  // RIGHT PANEL — text block vertically centered, footer pinned to bottom
  // ════════════════════════════════════════════════════════════════════════
  ctx.textAlign = "center";

  // Measure pass (needed for vertical centering)
  ctx.font = F.bold(fs.title);
  ctx.letterSpacing = "4px";
  const titleLines = wrapText(ctx, "✦  " + tags(settings.title) + "  ✦", rightW);
  ctx.letterSpacing = "0px";

  ctx.font = F.bold(fs.greeting);
  const greetLines = wrapText(ctx, tags(settings.greetingLine), rightW);

  ctx.font = F.light(fs.subtitle);
  const subLines = wrapText(ctx, tags(settings.subtitle), rightW);

  ctx.font = F.regular(fs.body);
  const bodyLH       = fs.body + 8;
  const rawBodyLines = tags(settings.bodyText).split("\\n");
  const allBodyLines = rawBodyLines.flatMap(raw => wrapText(ctx, raw, rightW));

  const spacing     = 8;
  const ulGap       = 14;
  const totalBlockH =
    titleLines.length  * (fs.title    + 7) + spacing +
    greetLines.length  * (fs.greeting + 7) + ulGap   +
    subLines.length    * (fs.subtitle + 6) + spacing +
    allBodyLines.length * bodyLH;

  const footerZoneH = fs.footer + 30;
  const availH      = H - 20 - footerZoneH;
  let cursorY = 45 + Math.max(0, (availH - totalBlockH) / 2) + fs.title;

  // Title
  ctx.font = F.bold(fs.title);
  ctx.letterSpacing = "4px";
  ctx.fillStyle = hexToRgba(cfg.accentColor, 0.85);
  for (const line of titleLines) {
    ctx.fillText(line, rightCX, cursorY);
    cursorY += fs.title + 25;
  }
  ctx.letterSpacing = "0px";
  cursorY += spacing;

  // Greeting
  ctx.font = F.bold(fs.greeting);
  ctx.fillStyle = cfg.greetingColor;
  const greetTopY = cursorY;
  for (const line of greetLines) {
    ctx.fillText(line, rightCX, cursorY);
    cursorY += fs.greeting + 7;
  }

  // Underline
  const ulY = greetTopY + fs.greeting + 30;
  const ulg = ctx.createLinearGradient(rightL, 0, rightR, 0);
  ulg.addColorStop(0,   "transparent");
  ulg.addColorStop(0.1, cfg.accentColor);
  ulg.addColorStop(0.9, cfg.accentColor);
  ulg.addColorStop(1,   "transparent");
  ctx.strokeStyle = ulg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(rightL + 5, ulY); ctx.lineTo(rightR - 5, ulY); ctx.stroke();
  cursorY = Math.max(cursorY, ulY + ulGap);

  // Subtitle
  ctx.font = F.light(fs.subtitle);
  ctx.fillStyle = cfg.subtitleColor;
  for (const line of subLines) {
    ctx.fillText(line, rightCX, cursorY);
    cursorY += fs.subtitle + 7;
  }
  cursorY += spacing;

  // Body
  ctx.font = F.regular(fs.body);
  ctx.fillStyle = cfg.bodyColor;
  for (const line of allBodyLines) {
    ctx.fillText(line, rightCX, cursorY);
    cursorY += bodyLH;
  }

  // Footer — pinned to bottom
  const footerY = H - 18;
  ctx.strokeStyle = hexToRgba(cfg.accentColor, 0.18);
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(rightL + 10, footerY - fs.footer - 8);
  ctx.lineTo(rightR - 10, footerY - fs.footer - 8);
  ctx.stroke();
  ctx.font      = F.light(fs.footer);
  ctx.fillStyle = hexToRgba(cfg.accentColor, 0.6);
  ctx.fillText(tags(settings.footer), rightCX, footerY);

  ctx.textAlign = "left";
}

// ─── Main Export ──────────────────────────────────────────────────────────────

async function generateWelcomeCard(member) {
  const cfg       = config.canvas;
  const fontSizes = config.fonts;
  const { width, height } = cfg;
  const guildId   = member.guild?.id || null;

  const settings = getGuildSettings(guildId);

  const canvas = createCanvas(width, height);
  const ctx    = canvas.getContext("2d");

  // 1. Background
  const bgPath = settings.backgroundPath || getCachedBackground(guildId);
  if (bgPath && fs.existsSync(bgPath)) {
    await drawCustomBackground(ctx, bgPath, width, height);
  } else {
    drawFireBackground(ctx, width, height);
  }

  // 2. Particles
  drawParticles(ctx, width, height, member.user.id);

  // 3. Frame + divider
  drawCardFrame(ctx, width, height);
  drawAccentLines(ctx);

  // 4. Avatar
  const avatarUrl =
    member.user.displayAvatarURL({ extension: "png", forceStatic: true }) ||
    `https://cdn.discordapp.com/embed/avatars/${parseInt(member.user.discriminator || "0") % 5}.png`;
  await drawAvatar(ctx, avatarUrl, cfg);

  // 5. Text
  drawTextContent(ctx, member, cfg, settings, fontSizes);

  return canvas.toBuffer("image/png");
}

module.exports = { generateWelcomeCard };