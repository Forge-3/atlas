import type { DiscordInviteApiResponse } from "./types";

export const validateDiscordInvite = async (
  inviteCode: string,
  expectedGuildId: string
): Promise<DiscordInviteApiResponse> => {
  if (!inviteCode || inviteCode.includes("/")) {
    throw new Error("Invalid Discord invite code format.");
  }

  const url = `https://discord.com/api/v10/invites/${inviteCode}?with_counts=false`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Discord API returned status ${response.status}: ${errorText}`
    );
  }

  const inviteData: DiscordInviteApiResponse = await response.json();

  const guild = inviteData.guild;

  if (guild && guild.id === expectedGuildId) {
    return inviteData;
  } else if (guild) {
    throw new Error(
      `Invite is for a different server/`
    );
  } else {
    throw new Error("Invite is not for a valid server.");
  }
};