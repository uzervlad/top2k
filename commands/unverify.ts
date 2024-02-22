import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, type CacheType } from "discord.js";
import Command from "../command";
import type { Context } from "../context";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";

export default class UnverifyCommand extends Command {
  data = new SlashCommandBuilder()
    .setName('unverify')
    .setDescription('description')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

  ephemeral = true;

  async execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context) {
    await db.delete(users).where(eq(users.id, interaction.user.id));

    interaction.editReply("unverified");
  }
}