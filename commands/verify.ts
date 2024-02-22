import { SlashCommandBuilder, type CacheType, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import Command from "../command";
import { db } from "../db";
import { users, verifications } from "../schema";
import { eq } from "drizzle-orm";
import type { Context } from "../context";
import { getRoleId } from "../update";

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

    const [ verification ] = await db.select()
      .from(verifications)
      .where(eq(verifications.id, interaction.user.id));

    if(!verification) {
      return interaction.editReply("No pending verification found");
    }

    if(verification.code != code) {
      return interaction.editReply("Wrong verification code");
    }

    await db.delete(verifications).where(eq(verifications.code, code));

    // 10 minutes expiry
    if(verification.time + 600000 < Date.now()) {
      return interaction.editReply("Your verification has expired");
    }

    await db.insert(users).values({
      id: interaction.user.id,
      username: interaction.user.tag,
      osu_id: verification.osu_id,
      verify_method: "global_rank",
      verify_time: Date.now(),
    });

    let discordUser = await context.guild.members.fetch(interaction.user.id);
    discordUser.roles.add([
      Bun.env.ROLE_ID_VERIFIED,
      getRoleId(verification.rank)
    ]);

    interaction.editReply("You have been verified. Welcome to top2k!");
  }
}