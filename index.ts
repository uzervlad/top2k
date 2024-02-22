import { Client, Events, GatewayIntentBits } from "discord.js";
import { createCommands } from "./command";
import registerSlashCommands from "./register";
import server from "./server";
import createContext, { type Context } from "./context";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { getRoleId } from "./update";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

const commands = await createCommands();

console.log("Registering commands...");

await registerSlashCommands(commands);

let context: Context;

server.listen(8877);

client.once(Events.ClientReady, async client => {
  console.log(`Logged in as ${client.user.tag}`);
  context = await createContext(client);
});

client.on(Events.InteractionCreate, async interaction => {
  if(!interaction.isChatInputCommand()) return;
  
  const command = commands.find(c => c.data.name == interaction.commandName);

  if(!command) {
    interaction.reply({
      ephemeral: true,
      content: "how the fuck?",
    });
    return;
  }

  try {
    await interaction.deferReply({
      ephemeral: command.ephemeral,
    });
    await command.execute(interaction, context);
  } catch(e) {
    console.log(e);
    interaction.editReply({
      content: 'oopsie daisy i got an error (ping octo)',
    });
  }
});

client.on(Events.GuildMemberAdd, async member => {
  let user = await db.select().from(users).where(eq(users.id, member.user.id));
  if(user)
    member.roles.add(Bun.env.ROLE_ID_VERIFIED);
});

client.login(Bun.env.DISCORD_TOKEN);