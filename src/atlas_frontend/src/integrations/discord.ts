import axios from "axios";
import { DISCORD_CALLBACK_PATH } from "../router/paths";

export interface UserData {
  accent_color: null | string;
  avatar: null | string;
  avatar_decoration_data: null | string;
  banner: null | string;
  banner_color: null | string;
  clan: null | string;
  collectibles: null | string;
  email: string;
  flags: number;
  id: string;
  locale: string;
  discriminator: null | string;
  mfa_enabled: boolean;
  premium_type: number;
  primary_guild: null | string;
  public_flags: number;
  username: string;
  verified: boolean;
}
export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface DiscordAuthData {
  tokenType: string;
  accessToken: string;
  state: string;
  expiresIn: number;
}

export const getOAuth2URL = (stateData?: string) => {
  const discordBase = "https://discord.com";
  const path = "/oauth2/authorize";
  const url = new URL(path, discordBase);

  url.searchParams.set("client_id", import.meta.env.PUBLIC_DISCORD_CLIENT_ID);
  url.searchParams.set(
    "redirect_uri",
    new URL(DISCORD_CALLBACK_PATH, window.location.origin).toString()
  );
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", "identify guilds");
  stateData && url.searchParams.set("state", stateData);

  return url.toString();
};

export const getGuildsData = async (token: string): Promise<DiscordGuild[]> => {
  const { data } = await axios.get<DiscordGuild[]>(
    "https://discord.com/api/users/@me/guilds",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};


