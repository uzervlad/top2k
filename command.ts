import type { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { readdir } from "node:fs/promises";
import type { Context } from "./context";

export async function createCommands(): Promise<Command[]> {
  return readdir('./commands').then(files => Promise.all(files.map(file => import(`./commands/${file}`).then(i => new i.default()))))
}

type SlashCommandData = Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

export default abstract class Command {
  abstract readonly data: SlashCommandData;

  public ephemeral: boolean = false;

  abstract execute(interaction: ChatInputCommandInteraction<CacheType>, context: Context): Promise<any>;
}