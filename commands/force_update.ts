import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, type CacheType } from "discord.js";
import Command from "../command";
import type { Context } from "../context";
import update from "../update";
import { Log } from "../logger";

export default class ForceUpdateCommand extends Command {
  data = new SlashCommandBuilder()
    .setName('force-update')
    .setDescription('Force update all users\' stats')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  ephemeral = true;

  async execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context) {
    clearTimeout(context.update_timeout);
    update(context);

    Log.info(`Force update requested by ${interaction.user.id} (${interaction.user.tag})`);

    interaction.editReply("Update started");
  }
}