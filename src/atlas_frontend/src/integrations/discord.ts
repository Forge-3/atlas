import axios from "axios";

export const CALLBACK_PATH = "/auth/discord/callback";

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

export const getOAuth2URL = (stateData?: string) => {
  const discordBase = "https://discord.com";
  const path = "/oauth2/authorize";
  const url = new URL(path, discordBase);

  url.searchParams.set("client_id", import.meta.env.PUBLIC_DISCORD_CLIENT_ID);
  url.searchParams.set(
    "redirect_uri",
    new URL(CALLBACK_PATH, window.location.origin).toString()
  );
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", "identify");
  stateData && url.searchParams.set("state", stateData);

  return url.toString();
};

export const getUserData = async (token: string) => {
  const { data } = await axios.get<UserData>(
    "https://discord.com/api/users/@me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data
};
