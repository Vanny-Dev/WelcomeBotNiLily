/**
 * commands/uploadwelcomebg.js
 * /uploadwelcomebg — Accepts a direct file attachment (image or GIF).
 * This is the companion to /setwelcomebg (which takes a URL).
 * Discord slash commands support attachments as options natively.
 */

const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { updateGuildSettings } = require("../storage");
const { downloadBackground }  = require("../backgroundManager");
const { hasPermission, denyReply } = require("../permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uploadwelcomebg")
    .setDescription("Upload an image or GIF file to use as the welcome card background")
    .setDefaultMemberPermissions(null) // Handled by role check below
    .addAttachmentOption((opt) =>
      opt
        .setName("background")
        .setDescription("The image or GIF file to use as background")
        .setRequired(true),
    ),

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyReply(interaction);
    await interaction.deferReply({ ephemeral: false });

    const attachment = interaction.options.getAttachment("background");

    // Validate it is an image/gif
    const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!validTypes.includes(attachment.contentType)) {
      return interaction.editReply({
        content: `❌ Unsupported file type: **${attachment.contentType}**.\nPlease upload a PNG, JPG, GIF, or WebP.`,
      });
    }

    // Max 8 MB
    if (attachment.size > 8 * 1024 * 1024) {
      return interaction.editReply({ content: "❌ File is too large. Max size is **8 MB**." });
    }

    try {
      const localPath = await downloadBackground(attachment.url, interaction.guildId);
      updateGuildSettings(interaction.guildId, {
        backgroundUrl:  attachment.url,
        backgroundPath: localPath,
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00c853)
            .setTitle("✅ Background Uploaded!")
            .setDescription(`**${attachment.name}** is now the welcome card background.`)
            .setImage(attachment.url)
            .setFooter({ text: "Use /previewwelcome to see the full card." }),
        ],
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed to save the file: **${err.message}**` });
    }
  },
};