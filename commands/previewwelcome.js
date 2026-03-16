/**
 * commands/previewwelcome.js
 * /previewwelcome — Generates and sends a preview of the welcome card
 * using the command author as the "new member", with current guild settings.
 */

const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { generateWelcomeCard } = require("../welcomeCard");
const { hasPermission, denyReply } = require("../permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("previewwelcome")
    .setDescription("Preview the welcome card with your own profile")
    .setDefaultMemberPermissions(null), // Handled by role check below

  async execute(interaction) {
    if (!hasPermission(interaction.member)) return denyReply(interaction);
    await interaction.deferReply({ ephemeral: false });

    try {
      // Use the command author as a mock "new member"
      const mockMember = interaction.member;
      mockMember.joinedTimestamp = Date.now();

      const imageBuffer = await generateWelcomeCard(mockMember);
      const attachment  = new AttachmentBuilder(imageBuffer, { name: "welcome-preview.png" });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff6a00)
            .setTitle("👁️ Welcome Card Preview")
            .setDescription("This is how the card will look when a new member joins.")
            .setImage("attachment://welcome-preview.png")
            .setFooter({ text: "Use /editwelcome or /setwelcomebg to make changes." }),
        ],
        files: [attachment],
      });
    } catch (err) {
      console.error("[previewwelcome]", err);
      await interaction.editReply({ content: `❌ Error generating preview: ${err.message}` });
    }
  },
};