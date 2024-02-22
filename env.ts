declare module "bun" {
  interface Env {
    DISCORD_TOKEN: string;
    DISCORD_ID: string;
    GUILD_ID: string;

    ROLE_ID_A: string;
    ROLE_ID_B: string;
    ROLE_ID_C: string;
    ROLE_ID_D: string;
    ROLE_ID_VERIFIED: string;

    CLIENT_ID: string;
    CLIENT_SECRET: string;
    REDIRECT_URI: string;
  }
}