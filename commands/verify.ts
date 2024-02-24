import { SlashCommandBuilder, type CacheType, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import Command from "../command";
import { db } from "../db";
import { users, verifications } from "../schema";
import { eq } from "drizzle-orm";
import type { Context } from "../context";
import { getRoleId } from "../update";
import { Log } from "../logger";

export default class VerifyCommand extends Command {
  data = new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify your osu! account")
    .addStringOption(
      option => option
        .setName("code")
        .setDescription("Verification code")
        .setRequired(false)
    );

    ephemeral = true;

  async execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context) {
    const code = interaction.options.getString("code");

    if(!code) {
      const verifyButton = new ButtonBuilder()
        .setURL(`https://osu.ppy.sh/oauth/authorize?client_id=${Bun.env.CLIENT_ID}&redirect_uri=${Bun.env.REDIRECT_URI}&response_type=code&scope=public+identify&state=${interaction.user.id}`)
        .setEmoji("✅")
        .setLabel("Verify")
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder()
        .addComponents(verifyButton);

      return interaction.editReply({
        content: `clik butn`,
        components: [row as any],
      });
    }

    Log.info(`Verification attempt by ${interaction.user.id} (${interaction.user.tag})`);

    const [ verification ] = await db.select()
      .from(verifications)
      .where(eq(verifications.id, interaction.user.id));

    if(!verification) {
      Log.warn(`No pending verification for ${interaction.user.id} (${interaction.user.tag})`);
      return interaction.editReply("No pending verification found");
    }

    if(verification.code != code) {
      Log.warn(`Invalid verification code for ${interaction.user.id} (${interaction.user.tag})`);
      return interaction.editReply("Wrong verification code");
    }

    await db.delete(verifications).where(eq(verifications.code, code));

    // 10 minutes expiry
    if(verification.time + 600000 < Date.now()) {
      Log.warn(`Verification has expired for ${interaction.user.id} (${interaction.user.tag})`);
      return interaction.editReply("Your verification has expired");
    }

    let [ dbUser ] = await db.select().from(users).where(eq(users.id, interaction.user.id));

    if(dbUser) {
      await db
        .update(users)
        .set({
          verify_method: verification.method,
          osu_id: verification.osu_id,
        })
        .where(eq(users.id, interaction.user.id));
    } else {
      await db.insert(users).values({
        id: interaction.user.id,
        username: interaction.user.tag,
        osu_id: verification.osu_id,
        verify_method: verification.method,
        verify_time: Date.now(),
      });
    }

    let discordUser = await context.guild.members.fetch(interaction.user.id);
    if(verification.method == "global_rank")
      discordUser.roles.add([
        Bun.env.ROLE_ID_VERIFIED,
        getRoleId(verification.rank)
      ]);
    else if(verification.method == "ranked_mapper")
      discordUser.roles.add([
        Bun.env.ROLE_ID_VERIFIED,
        Bun.env.ROLE_ID_MAPPER,
      ]);

    Log.info(`Verification successful for ${interaction.user.id} (${interaction.user.tag})`);

    interaction.editReply("You have been verified. Welcome to top2k!");
  }
}