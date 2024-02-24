import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Events, GatewayIntentBits } from "discord.js";
import { createCommands } from "./command";
import registerSlashCommands from "./register";
import server from "./server";
import createContext, { type Context } from "./context";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { Log } from "./logger";
import update, { UPDATE_INTERVAL } from "./update";

Log.init();

Log.info("Starting...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const commands = await createCommands();

console.log("Registering commands...");

await registerSlashCommands(commands);

let context: Context;

server.listen(8877);

client.once(Events.ClientReady, async client => {
  console.log(`Logged in as ${client.user.tag}`);
  
  context = await createContext(client);

  setTimeout(() => update(context), UPDATE_INTERVAL);
});

client.on(Events.InteractionCreate, async interaction => {
  if(interaction.isChatInputCommand()) {
    const command = commands.find(c => c.data.name == interaction.commandName);

    if(!command) {
      interaction.reply({
        ephemeral: true,
        content: "how the fuck? (ping octo this shouldn't happen!!!!!)",
      });
      return;
    }

    try {
      await interaction.deferReply({
        ephemeral: command.ephemeral,
      });
      await command.execute(interaction, context);
    } catch(e: any) {
      Log.error(`Unexpected exception on ${interaction.commandName} [${interaction.user.tag}|${interaction.user.id}]`);
      Log.error(e.stack.split("\n"));
      
      interaction.editReply({
        content: 'oopsie daisy i got an error (ping octo)',
      });
    }
  } else if(interaction.isButton()) {
    if(interaction.customId == "verify-button") {
      const verifyButton = new ButtonBuilder()
        .setURL(`https://osu.ppy.sh/oauth/authorize?client_id=${Bun.env.CLIENT_ID}&redirect_uri=${Bun.env.REDIRECT_URI}&response_type=code&scope=public+identify&state=${interaction.user.id}`)
        .setEmoji("✅")
        .setLabel("Proceed")
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder()
        .addComponents(verifyButton);

      interaction.reply({
        ephemeral: true,
        content: `Click to proceed`,
        components: [row as any],
      });
    }
  }
});

client.on(Events.GuildMemberAdd, async member => {
  let user = await db.select().from(users).where(eq(users.id, member.user.id));
  if(user)
    member.roles.add(Bun.env.ROLE_ID_VERIFIED);
});

client.login(Bun.env.DISCORD_TOKEN);