import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, type CacheType, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import Command from "../command";
import type { Context } from "../context";

export default class ButtonCommand extends Command {
  data = new SlashCommandBuilder()
    .setName('button')
    .setDescription('Create a message with the "verify" button')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  
  async execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context) {
    const verifyButton = new ButtonBuilder()
      .setCustomId("verify-button")
      .setEmoji("✅")
      .setLabel("Verify")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder()
      .addComponents(verifyButton);

    return interaction.editReply({
      content: `Click to start verification`,
      components: [row as any],
    });
  }
}