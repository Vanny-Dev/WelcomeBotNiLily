/**
 * permissions.js
 * Central role-based permission guard for all welcome bot commands.
 *
 * Usage:
 *   const { hasPermission, denyReply } = require("../permissions");
 *   if (!hasPermission(interaction.member)) return denyReply(interaction);
 */

const { EmbedBuilder } = require("discord.js");
const config = require("./config");

/**
 * Returns true if the member holds at least one of the two allowed roles.
 * Server owners always pass regardless of roles.
 * @param {GuildMember} member
 */
function hasPermission(member) {
  if (!member) return false;

  // Server owner always has access
  if (member.guild.ownerId === member.id) return true;

  const { allowedRoleIds } = config;

  // If no roles are configured yet, fall back to Administrator permission
  if (!allowedRoleIds || allowedRoleIds.every(id => !id || id.includes("HERE"))) {
    return member.permissions.has(0x8n); // ADMINISTRATOR
  }

  return allowedRoleIds.some(roleId => roleId && member.roles.cache.has(roleId));
}

/**
 * Sends an ephemeral "no permission" embed reply.
 * Handles both un-replied and deferred interactions.
 * @param {CommandInteraction | ModalSubmitInteraction} interaction
 */
async function denyReply(interaction) {
  const { allowedRoleIds } = config;

  const roleList = allowedRoleIds
    .filter(id => id && !id.includes("HERE"))
    .map(id => `<@&${id}>`)
    .join("  •  ") || "_(not yet configured)_";

  const embed = new EmbedBuilder()
    .setColor(0xff2200)
    .setTitle("🔒 Access Denied")
    .setDescription("You don't have the required role to use this command.")
    .addFields({ name: "Allowed Roles", value: roleList })
    .setFooter({ text: "Contact a server admin if you think this is wrong." });

  const payload = { embeds: [embed], ephemeral: true };

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch {}
}

module.exports = { hasPermission, denyReply };