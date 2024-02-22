import { REST, Routes } from "discord.js";
import Command from "./command";

export default async function registerSlashCommands(commands: Command[]) {
  const rest = new REST().setToken(Bun.env.DISCORD_TOKEN);

  let data: any = await rest.put(
    Routes.applicationGuildCommands(Bun.env.DISCORD_ID, Bun.env.GUILD_ID),
    { body: commands.map(c => c.data.toJSON()) },
  );

  console.log(`Registered ${data.length} commands!`);
}