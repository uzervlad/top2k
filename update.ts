import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";
import OsuAPI from "./api";
import type { Client } from "discord.js";
import { Log } from "./logger";

const roles = [Bun.env.ROLE_ID_A, Bun.env.ROLE_ID_B, Bun.env.ROLE_ID_C, Bun.env.ROLE_ID_D];

export function getRoleId(rank: number) {
  if(rank < 10)
    return roles[0];
  if(rank < 100)
    return roles[1];
  if(rank < 1000)
    return roles[2];
  return roles[3];
}

let updateInProgress = false;

export default async function update(client: Client) {
  if(updateInProgress) return;
  updateInProgress = true;

  try {
    let guild = await client.guilds.fetch(Bun.env.GUILD_ID);

    let allUsers = await db.select().from(users).where(and(eq(users.verify_method, "global_rank"), isNotNull(users.osu_id)));
    while(allUsers.length > 0) {
      let batch = allUsers.splice(0, 50);
      let batchUsers = await OsuAPI.getUsers(batch.map(user => user.osu_id!));
      for(let batchUser of batchUsers) {
        let user = batch.find(user => user.osu_id == batchUser.id)!;

        await db
          .update(users)
          .set({ osu_username: batchUser.username })
          .where(eq(users.osu_id, batchUser.id));

        let discordMember = await guild.members.fetch(user.id);

        let rolesToRemove = discordMember.roles.cache.filter(role => roles.includes(role.id)).map(role => role.id);
        let roleToAdd = getRoleId(batchUser.statistics_rulesets.osu.global_rank);
        rolesToRemove = rolesToRemove.filter(role => role != roleToAdd);

        if(rolesToRemove.length)
          await discordMember.roles.remove(rolesToRemove);
        
        if(!discordMember.roles.cache.has(roleToAdd))
          await discordMember.roles.add(roleToAdd);
      }
      await Bun.sleep(3000);
    }
  } catch(e: any) {
    Log.error("Unexpected exception while updating user data");
    Log.error(e.trace.split("\n"));
  }
  updateInProgress = false;
}