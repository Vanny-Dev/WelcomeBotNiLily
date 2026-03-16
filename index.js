const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  REST,
  Routes,
  Collection,
} = require("discord.js");
const fs     = require("fs");
const path   = require("path");
const config = require("./config");
const { generateWelcomeCard } = require("./welcomeCard");
require('dotenv').config();

// ─── Load Commands ────────────────────────────────────────────────────────────
const commands     = new Collection();  // name → module
const commandsData = [];                // for REST registration

const cmdDir = path.join(__dirname, "commands");
fs.readdirSync(cmdDir).filter(f => f.endsWith(".js")).forEach(file => {
  const cmd = require(path.join(cmdDir, file));
  commands.set(cmd.data.name, cmd);
  commandsData.push(cmd.data.toJSON());
});

// ─── Bot Client ───────────────────────────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// ─── Register Slash Commands (once on ready) ──────────────────────────────────
client.once("ready", async () => {
  console.log(`\n✦ Welcome Bot online as ${client.user.tag}`);

  try {
    const rest = new REST({ version: "10" }).setToken(config.token);

    if (config.guildId) {
      // Fast guild-scoped registration (instant, dev-friendly)
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, config.guildId),
        { body: commandsData }
      );
      console.log(`✦ Slash commands registered to guild ${config.guildId}`);
    } else {
      // Global registration (takes up to 1 hour to propagate)
      await rest.put(Routes.applicationCommands(client.user.id), { body: commandsData });
      console.log("✦ Slash commands registered globally");
    }
  } catch (err) {
    console.error("✗ Failed to register commands:", err);
  }

  client.user.setActivity("the gates", { type: 3 });
});

// ─── Interaction Router ───────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  // ── Slash Commands ──────────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const cmd = commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(`[/${interaction.commandName}]`, err);
      const reply = { content: "❌ An error occurred.", ephemeral: true };
      interaction.replied || interaction.deferred
        ? await interaction.editReply(reply)
        : await interaction.reply(reply);
    }
    return;
  }

  // ── Modal Submissions ───────────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    if (interaction.customId === "modal_setbg") {
      const cmd = commands.get("setwelcomebg");
      return cmd?.handleModal(interaction);
    }
    if (interaction.customId === "modal_edittext") {
      const cmd = commands.get("editwelcome");
      return cmd?.handleModal(interaction);
    }
  }
});

// ─── New Member Welcome ───────────────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  try {
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) {
      console.warn(`[Welcome Bot] Channel "${config.welcomeChannelId}" not found in ${member.guild.name}`);
      return;
    }

    console.log(`[Welcome Bot] Generating card for ${member.user.tag}...`);
    const imageBuffer = await generateWelcomeCard(member);
    const attachment  = new AttachmentBuilder(imageBuffer, { name: "welcome.png" });

    const payload = { files: [attachment] };

    if (config.embed.enabled) {
      payload.embeds = [buildEmbed(member)];
    }

    await channel.send(payload);
    console.log(`[Welcome Bot] ✓ Welcomed ${member.user.tag} (#${member.guild.memberCount})`);

    if (config.dm.enabled) {
      try { await member.send(config.dm.message); }
      catch { console.warn(`[Welcome Bot] Could not DM ${member.user.tag}`); }
    }
  } catch (err) {
    console.error("[Welcome Bot] Error on guildMemberAdd:", err);
  }
});

// ─── Embed Builder ────────────────────────────────────────────────────────────
function buildEmbed(member) {
  const joinDate = new Date(member.joinedTimestamp).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const embed = new EmbedBuilder()
    .setColor(config.embed.color)
    .setImage("attachment://welcome.png")
    .setTimestamp();

  if (config.embed.showMemberCount)
    embed.addFields({ name: "👥 Member Count", value: `You are member **#${member.guild.memberCount}**`, inline: true });
  if (config.embed.showJoinDate)
    embed.addFields({ name: "📅 Joined", value: joinDate, inline: true });
  if (config.embed.rulesChannelId)
    embed.addFields({ name: "📜 Rules", value: `<#${config.embed.rulesChannelId}>`, inline: true });
  if (config.embed.rolesChannelId)
    embed.addFields({ name: "🎭 Get Roles", value: `<#${config.embed.rolesChannelId}>`, inline: true });

  embed.setFooter({
    text: member.guild.name,
    iconURL: member.guild.iconURL({ dynamic: true }) || undefined,
  });

  return embed;
}

// ─── Error Handling ───────────────────────────────────────────────────────────
client.on("error", err => console.error("[Discord Error]", err));
process.on("unhandledRejection", err => console.error("[Unhandled Rejection]", err));

// ─── Login ────────────────────────────────────────────────────────────────────
if (!config.token || config.token === "YOUR_BOT_TOKEN_HERE") {
  console.error("✗ Please set your bot token in config.js first!");
  process.exit(1);
}

client.login(config.token || process.env.TOKEN).catch(err => {
  console.error("✗ Login failed:", err.message);
  process.exit(1);
});