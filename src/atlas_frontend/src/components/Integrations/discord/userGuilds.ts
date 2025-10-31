import type { DiscordGuild } from "./types";

export const getUserGuilds = async (token: string): Promise<DiscordGuild[]> => {
  const url = "https://discord.com/api/users/@me/guilds";

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user guilds: ${response.statusText}`);
  }

  const guilds: DiscordGuild[] = await response.json();
  return guilds;
};
