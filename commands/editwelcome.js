/**
 * commands/editwelcome.js
 * /editwelcome — Opens a modal with fields for Title, Subtitle, and Body Text.
 * Changes are saved per-guild and take effect immediately on the next join.
 *
 * Supports dynamic tags: {username} {tag} {memberCount} {serverName}
 */

const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const { getGuildSettings, updateGuildSettings } = require("../storage");
const { hasPermission, denyReply } = require("../permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editwelcome")
    .setDescription("Edit the welcome card text: title, subtitle and body")
    .setDefaultMemberPermissions(null), // Handled by role check below

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyReply(interaction);
    const settings = getGuildSettings(interaction.guildId);

    const modal = new ModalBuilder()
      .setCustomId("modal_edittext")
      .setTitle("✏️ Edit Welcome Card Text");

    const titleInput = new TextInputBuilder()
      .setCustomId("wc_title")
      .setLabel("Title  (shown at the top)")
      .setStyle(TextInputStyle.Short)
      .setValue(settings.title)
      .setMaxLength(60)
      .setRequired(true);

    const subtitleInput = new TextInputBuilder()
      .setCustomId("wc_subtitle")
      .setLabel("Subtitle  (italic line below greeting)")
      .setStyle(TextInputStyle.Short)
      .setValue(settings.subtitle)
      .setMaxLength(80)
      .setRequired(true);

    const greetingInput = new TextInputBuilder()
      .setCustomId("wc_greeting")
      .setLabel("Greeting Line  ({username} supported)")
      .setStyle(TextInputStyle.Short)
      .setValue(settings.greetingLine)
      .setMaxLength(80)
      .setRequired(true);

    const bodyInput = new TextInputBuilder()
      .setCustomId("wc_body")
      .setLabel("Body Text  (use \\n for new lines)")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(settings.bodyText)
      .setMaxLength(200)
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId("wc_footer")
      .setLabel("Footer  (small text at bottom)")
      .setStyle(TextInputStyle.Short)
      .setValue(settings.footer)
      .setMaxLength(100)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(subtitleInput),
      new ActionRowBuilder().addComponents(greetingInput),
      new ActionRowBuilder().addComponents(bodyInput),
      new ActionRowBuilder().addComponents(footerInput),
    );

    await interaction.showModal(modal);
  },

  async handleModal(interaction) {
    if (!hasPermission(interaction.member)) return denyReply(interaction);
    const title       = interaction.fields.getTextInputValue("wc_title").trim();
    const subtitle    = interaction.fields.getTextInputValue("wc_subtitle").trim();
    const greetingLine= interaction.fields.getTextInputValue("wc_greeting").trim();
    const bodyText    = interaction.fields.getTextInputValue("wc_body").trim();
    const footer      = interaction.fields.getTextInputValue("wc_footer").trim();

    updateGuildSettings(interaction.guildId, { title, subtitle, greetingLine, bodyText, footer });

    const preview = (str) => str.replace(/{username}/g, interaction.user.username)
      .replace(/{tag}/g, interaction.user.tag)
      .replace(/{memberCount}/g, interaction.guild.memberCount)
      .replace(/{serverName}/g, interaction.guild.name);

    await interaction.reply({
      ephemeral: false,
      embeds: [
        new EmbedBuilder()
          .setColor(0x00c853)
          .setTitle("✅ Welcome Card Text Updated!")
          .setDescription("Here's how your text will look with your username as a preview:")
          .addFields(
            { name: "📌 Title",    value: `\`${title}\``,              inline: false },
            { name: "💬 Greeting", value: preview(greetingLine),       inline: false },
            { name: "✨ Subtitle", value: `_${preview(subtitle)}_`,    inline: false },
            { name: "📄 Body",     value: preview(bodyText) || "—",    inline: false },
            { name: "🔻 Footer",   value: preview(footer) || "—",     inline: false },
          )
          .setFooter({ text: "Use /previewwelcome to generate a full card preview." }),
      ],
    });
  },
};