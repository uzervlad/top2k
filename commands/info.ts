import { ChatInputCommandInteraction, SlashCommandBuilder, type CacheType, EmbedBuilder } from "discord.js";
import Command from "../command";
import type { Context } from "../context";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import dateFormat from "dateformat";

export default class InfoCommand extends Command {
  data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get verified user\'s info')
    .addUserOption(
      option => option
        .setName('user')
        .setDescription('User to fetch')
        .setRequired(true)
    );

  async execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context) {
    let user = interaction.options.getUser('user', true);
    let [ data ] = await db.select().from(users).where(eq(users.id, user.id));

    if(!data) {
      return interaction.editReply({
        content: "User is not verified",
      });
    }

    let embed = new EmbedBuilder()
      .setAuthor({
        name: data.username,
        url: `https://osu.ppy.sh/u/${data.osu_id}`,
      })
      .setThumbnail(`https://a.ppy.sh/${data.osu_id}`)
      .setFields({
        name: "Verified as",
        value: data.verify_method,
      }, {
        name: "Verified at",
        value: dateFormat(data.verify_time),
        inline: true,
      });

    interaction.editReply({
      embeds: [embed]
    });
  }
}