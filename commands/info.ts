import { ChatInputCommandInteraction, SlashCommandBuilder, type CacheType, EmbedBuilder } from "discord.js";
import Command from "../command";
import type { Context } from "../context";
import { db } from "../db";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import dateFormat from "dateformat";

const DATEFORMAT_MASK = "yyyy-mm-dd h:MM TT";

async function createEmbed(context: Context, data: typeof users.$inferSelect) {
  let user = await context.guild.members.fetch(data.id);

  if(!data.osu_id) {
    if(data.verify_method == "pending")
      return new EmbedBuilder()
        .setAuthor({
          name: data.username
        })
        .setThumbnail(user.displayAvatarURL())
        .setDescription("User is pending re-verification");
    
    return new EmbedBuilder()
      .setAuthor({
        name: data.username
      })
      .setThumbnail(user.displayAvatarURL())
      .setFields({
        name: "Verified as",
        value: data.verify_method,
      }, {
        name: "Verified at",
        value: dateFormat(data.verify_time, DATEFORMAT_MASK),
        inline: true,
      });
  } else {
    return new EmbedBuilder()
      .setAuthor({
        name: data.osu_username!,
        url: `https://osu.ppy.sh/u/${data.osu_id}`,
      })
      .setThumbnail(`https://a.ppy.sh/${data.osu_id}`)
      .setFields({
        name: "Verified as",
        value: data.verify_method,
      }, {
        name: "Verified at",
        value: dateFormat(data.verify_time, DATEFORMAT_MASK),
        inline: true,
      });
  }
}

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

    let embed = await createEmbed(context, data);

    interaction.editReply({
      embeds: [embed]
    });
  }
}