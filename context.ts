import type { Client, Guild } from "discord.js";

export type Context = {
  guild: Guild
}

export default async function createContext(client: Client): Promise<Context> {
  return {
    guild: await client.guilds.fetch(Bun.env.GUILD_ID),
  }
}