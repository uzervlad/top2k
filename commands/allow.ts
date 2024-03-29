import { ChatInputCommandInteraction, SlashCommandBuilder, type CacheType, PermissionFlagsBits } from "discord.js";
import Command from "../command";
import { db } from "../db";
import { users, type VerificationMethod } from "../schema";
import { Log } from "../logger";
import { eq } from "drizzle-orm";
import OsuAPI from "../api";

export default class AllowCommand extends Command {
  data = new SlashCommandBuilder()
    .setName("allow")
    .setDescription("Manually allow access")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(
      option => option
        .setName("user")
        .setDescription("Discord user to verify")
        .setRequired(true)
    )
    .addNumberOption(
      option => option
        .setName("osu_id")
        .setDescription("User's osu! ID")
        .setRequired(true)
    )
    .addStringOption(
      option => option
        .setName("reason")
        .setDescription("Reason for verification")
        .setChoices()
        .addChoices(
          { name: "Global Rank", value: "global_rank" },
          { name: "Ranked Mapper", value: "ranked_mapper" },
          { name: "Other", value: "manual", },
        )
        .setRequired(true)
    )
    .addStringOption(
      option => option
        .setName("data")
        .setDescription("Additional data")
        .setRequired(false)
    );

  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    if(!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply({
        content: "no.",
      });
    }

    const user = interaction.options.getUser("user", true);
    const osuId = interaction.options.getNumber("osu_id", true);
    const reason = interaction.options.getString("reason", true);
    const data = interaction.options.getString("data");

    try {
      Log.info(`Manual verification for ${user.id} (${user.tag}) by ${interaction.user.id} (${interaction.user.tag})`);

      let osuUser = await OsuAPI.getUser(osuId);

      let [ dbUser ] = await db.select().from(users).where(eq(users.id, user.id));

      if(dbUser?.verify_method == "pending") {
        await db.update(users)
          .set({
            osu_id: osuId,
            osu_username: osuUser.username,
            verify_method: reason as VerificationMethod,
            verify_time: Date.now(),
            verify_data: data,
          })
          .where(eq(users.id, user.id))
      } else {
        await db.insert(users).values({
          id: user.id,
          username: user.tag,
          osu_id: osuId,
          osu_username: osuUser.username,
          verify_method: reason as VerificationMethod,
          verify_time: Date.now(),
          verify_data: data,
        });
      }
      interaction.editReply("Verified");
    } catch(e: any) {
      Log.error("Manual verification failed");
      Log.error(e.trace.split("\n"));
      
      interaction.editReply("Verification failed");
    }
  }
}