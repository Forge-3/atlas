import type { DiscordInviteApiResponse } from "./types";
import axios, { AxiosError } from "axios";

export const validateDiscordInvite = async (
  inviteCode: string,
  expectedGuildId: string
): Promise<DiscordInviteApiResponse> => {
  if (!inviteCode || inviteCode.includes("/")) {
    throw new Error("Invalid Discord invite code format.");
  }

  const url = `https://discord.com/api/v10/invites/${inviteCode}?with_counts=false`;

  let response;
  try {
    response = await axios.get(url);
  } catch (err: unknown) {
    throw new Error(
      `The invite link is invalid.`
    );
    
  }

  const inviteData: DiscordInviteApiResponse = response.data;

  const guild = inviteData.guild;

  if (guild && guild.id === expectedGuildId) {
    return inviteData;
  } else if (guild) {
    throw new Error(
      `Invite is for a different server`
    );
  } else {
    throw new Error("Invite is not for a valid server.");
  }
};