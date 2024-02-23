import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, type CacheType } from "discord.js";
import Command from "../command";
import type { Context } from "../context";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { Log } from "../logger";

export default class UnverifyCommand extends Command {
  data = new SlashCommandBuilder()
    .setName('unverify')
    .setDescription('description')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(
      option => option
        .setName('user')
        .setDescription('User to unverify')
    );

  ephemeral = true;

  async execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context) {
    let user = interaction.options.getUser('user') ?? interaction.user;

    Log.info(`Manual unverification for ${user.id} (${user.tag}) by ${interaction.user.id} (${interaction.user.tag})`);

    let member = await context.guild.members.fetch(user.id);
    await member.roles.remove(Bun.env.ROLE_ID_VERIFIED);
    await db.delete(users).where(eq(users.id, user.id));

    interaction.editReply("User unverified");
  }
}