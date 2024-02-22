import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type VerificationMethod = 
  "global_rank" | "ranked_mapper" | "manual" | "pending" | "other";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  osu_id: integer("osu_id"),
  osu_username: text("osu_username"),
  verify_time: integer("verify_time").notNull(),
  verify_method: text("verify_method").$type<VerificationMethod>().notNull(),
  verify_data: text("verify_data"),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  osu_id: integer("osu_id").notNull(),
  rank: integer("rank").notNull(),
  code: text("code").notNull(),
  time: integer("time").notNull(),
});