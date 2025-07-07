export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface DiscordGuildInfo {
  id: string;
  name: string;
}

export interface DiscordInviteApiResponse {
  guild: DiscordGuildInfo | null;
  expires_at: string | null;
}