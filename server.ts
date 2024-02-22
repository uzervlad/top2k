import { Elysia } from "elysia";
import { html } from "@elysiajs/html";
import axios from "axios";
import { db } from "./db";
import { users, verifications, type VerificationMethod } from "./schema";
import { eq, or } from "drizzle-orm";

type OsuTokenResponse = {
  access_token: string,
};

type OsuUser = {
  id: number,
  username: string,
  is_restricted: boolean,
  statistics: {
    global_rank: number,
  },
  ranked_and_approved_beatmapset_count: number,
};

function generateRandomCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = 8;

  return new Array(length).fill('').map(_ => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

const server = new Elysia()
  .get('/', () => "Nothing to look at here.")
  .get('/code', () => generateRandomCode())
  .get('/verify', async ({ set, query }) => {
    if(!('code' in query && 'state' in query)) {
      return "Invalid query."
    }

    let [ dbUser ] = await db.select()
      .from(users)
      .where(eq(users.id, query.state!));

    if(dbUser && dbUser.verify_method != 'pending') {
      return "User already verified.";
    }

    let { data: { access_token } } = await axios.post<OsuTokenResponse>('https://osu.ppy.sh/oauth/token', {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: query.code,
      grant_type: "authorization_code",
      redirect_uri: process.env.REDIRECT_URI,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip,deflate,compress",
      },
    });

    let { data: user } = await axios.get<OsuUser>('https://osu.ppy.sh/api/v2/me/osu', {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept-Encoding": "gzip,deflate,compress",
        "x-api-version": "20220705",
      },
    });

    console.log(user);

    if(!user) {
      return "No user found."
    }

    if(user.is_restricted) {
      return "Restricted."
    }

    let top2k = user.statistics.global_rank <= 2000;
    let mapper = user.ranked_and_approved_beatmapset_count;

    if(!top2k && !mapper) {
      return "Requirements not met.";
    }

    let [ verification ] = await db.select()
      .from(verifications)
      .where(
        or(
          eq(verifications.id, query.state!),
          eq(verifications.osu_id, user.id),
        )
      );
    
    if(verification) {
      return "There already is a verification pending.";
    }

    let code = generateRandomCode();

    let method: VerificationMethod = mapper ? "ranked_mapper" : "global_rank"

    await db.insert(verifications).values({
      id: query.state!,
      osu_id: user.id,
      rank: user.statistics.global_rank,
      method,
      time: Date.now(),
      code,
    })

    set.redirect = `/verification?${code}`;
  })
  .use(html())
  .get('/verification', () => Bun.file("./static/verification.html"));

export default server;