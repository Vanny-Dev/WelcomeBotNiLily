/**
 * commands/setwelcomebg.js
 * /setwelcomebg — Opens a modal where admins paste a background image/GIF URL.
 * Discord modals don't support file uploads natively, so the flow is:
 *   Modal field 1 → URL of the image/GIF
 *   Modal field 2 → Type CLEAR to reset to fire theme
 *
 * For file uploads, admins can also use /setwelcomebg then attach a file in
 * a follow-up message — handled by the attachmentUpload listener in index.js.
 */

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const { updateGuildSettings } = require("../storage");
const { downloadBackground }  = require("../backgroundManager");
const { hasPermission, denyReply } = require("../permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setwelcomebg")
    .setDescription("Set a custom background image or GIF for the welcome card")
    .setDefaultMemberPermissions(null), // Handled by role check below

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyReply(interaction);
    const modal = new ModalBuilder()
      .setCustomId("modal_setbg")
      .setTitle("🖼️ Set Welcome Background");

    const urlInput = new TextInputBuilder()
      .setCustomId("bg_url")
      .setLabel("Paste image/GIF URL here")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("https://i.imgur.com/example.gif")
      .setRequired(false);

    const clearInput = new TextInputBuilder()
      .setCustomId("bg_clear")
      .setLabel("Type CLEAR to reset to fire theme")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("CLEAR")
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(urlInput),
      new ActionRowBuilder().addComponents(clearInput),
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    if (!hasPermission(interaction.member)) return denyReply(interaction);
    await interaction.deferReply({ ephemeral: false });

    const url   = interaction.fields.getTextInputValue("bg_url").trim();
    const clear = interaction.fields.getTextInputValue("bg_clear").trim().toUpperCase();

    if (clear === "CLEAR") {
      updateGuildSettings(interaction.guildId, { backgroundUrl: null, backgroundPath: null });
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff6a00)
            .setTitle("🔥 Background Reset")
            .setDescription("Welcome card background reset to the **fire theme**."),
        ],
      });
    }

    if (!url) {
      return interaction.editReply({
        content: "❌ Please paste an image URL, or type **CLEAR** to reset.",
      });
    }

    try { new URL(url); } catch {
      return interaction.editReply({ content: "❌ That doesn't look like a valid URL." });
    }

    try {
      const localPath = await downloadBackground(url, interaction.guildId);
      updateGuildSettings(interaction.guildId, { backgroundUrl: url, backgroundPath: localPath });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00c853)
            .setTitle("✅ Background Updated!")
            .setDescription("The welcome card will now use your custom background.")
            .addFields({ name: "Source URL", value: url.length > 80 ? url.slice(0, 77) + "…" : url })
            .setImage(url)
            .setFooter({ text: "Use /previewwelcome to see it in action." }),
        ],
      });
    } catch (err) {
      await interaction.editReply({ content: `❌ Could not download that image: **${err.message}**` });
    }
  },
};