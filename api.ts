import axios from "axios";

export class APIToken {
  public access_token: string;
  public refresh_token: string;
  public expires_at: number;

  public get expired(): boolean {
    return Date.now() >= this.expires_at;
  }

  constructor(data: any) {
    this.access_token = data.access_token;
    this.refresh_token = data.refresh_token;
    this.expires_at = Date.now() + (data.expires_in - 30) * 1000;
  }
}

type APIUser = {
  id: number,
  username: string,
  statistics_rulesets: {
    osu: {
      global_rank: number,
    },
  },
};

export default class OsuAPI {
  private static token?: APIToken;

  private static async authorize() {
    let { data } = await axios.post('https://osu.ppy.sh/oauth/token', {
      client_id: Bun.env.CLIENT_ID,
      client_secret: Bun.env.CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "public",
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip,deflate,compress",
      },
    });

    this.token = new APIToken(data);
  }

  public static async getUser(id: number): Promise<APIUser> {
    if(!this.token || this.token.expired)
      await this.authorize();

    let { data } = await axios.get(`https://osu.ppy.sh/api/v2/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.token?.access_token}`,
        'Accept-Encoding': "gzip,deflate,compress",
      },
    });

    return data;
  }

  public static async getUsers(ids: number[]): Promise<APIUser[]> {
    if(!this.token || this.token.expired)
      await this.authorize();

    let { data } = await axios.get(`https://osu.ppy.sh/api/v2/users?${ids.map(id => `ids[]=${id}`).join('&')}`, {
      headers: {
        'Authorization': `Bearer ${this.token?.access_token}`,
        'Accept-Encoding': "gzip,deflate,compress",
      },
    });

    return data.users;
  }
}