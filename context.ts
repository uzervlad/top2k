import type { Client, Guild } from "discord.js";

export type Context = {
  client: Client,
  guild: Guild,
  update_timeout?: Timer
}

export default async function createContext(client: Client): Promise<Context> {
  return {
    client,
    guild: await client.guilds.fetch(Bun.env.GUILD_ID),
  }
}