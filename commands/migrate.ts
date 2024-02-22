import { ChatInputCommandInteraction, SlashCommandBuilder, type CacheType, PermissionFlagsBits, GuildMember, Collection } from "discord.js";
import Command from "../command";
import type { Context } from "../context";
import { db } from "../db";
import { users } from "../schema";

export default class MigrateCommand extends Command {
  data = new SlashCommandBuilder()
    .setName('migrate')
    .setDescription('yes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  async execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context) {
    let members = await context.guild.members.fetch().then((list: Collection<string, GuildMember>) => list.filter(member => member.roles.cache.has(Bun.env.ROLE_ID_VERIFIED)));
    let failed = [];
    for(let [_, member] of members) {
      try {
        await db
          .insert(users)
          .values({
            id: member.user.id,
            username: member.user.tag,
            verify_method: 'pending',
            verify_time: Date.now(),
          });
      } catch(e) {
        failed.push(member.user.tag);
      }
    }

    interaction.editReply(`Finished migrating. (${failed.join(', ')})`);
  }
}