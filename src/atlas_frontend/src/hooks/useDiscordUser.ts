import { useState } from "react";
import type { Principal } from "@dfinity/principal";
import toast from "react-hot-toast";
import { useAuthAtlasSpaceActor } from "./identityKit";
import { getDiscordGuilds } from "../canisters/atlasSpace/api";
import { useDiscordAuth } from "./useDiscordAuth";

export const useDiscordUser = (spacePrincipal?: Principal) => {
  const { accessToken, discordUser } = useDiscordAuth();
  const [isJoined, setIsJoined] = useState(false);
  const authAtlasSpace = spacePrincipal
    ? useAuthAtlasSpaceActor(spacePrincipal)
    : null;

  const joinServer = (inviteLink: string) => {
    window.open(inviteLink, "_blank");
    setIsJoined(true);
  };

  const checkGuildMembership = async (requiredGuildId: string) => {
    if (!accessToken) {
      toast.error("Authentication details are missing.");
      return false;
    }

    const toastId = toast.loading("Fetching your Discord guilds...");

    try {
      const userGuilds = await getDiscordGuilds(accessToken);
      toast.loading("Checking if you are a member of the guild...", { id: toastId });

      const isMember = userGuilds.some((guild) => guild.id === requiredGuildId);

      if (isMember) {
        toast.success("Approved! You are a member of the guild.", { id: toastId });
        return true;
      } else {
        toast.error(`You have to be a member of the required guild.`, { id: toastId });
        setIsJoined(false);
        return false;
      }
    } catch (error) {
      console.error("Failed to check guild membership:", error);
      toast.error("Failed to verify guild membership. Please try again.", { id: toastId });
      return false;
    }
  };

  return {
    isJoined,
    setIsJoined,
    joinServer,
    checkGuildMembership,
    discordUser,
  };
};