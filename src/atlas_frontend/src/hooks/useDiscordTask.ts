import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@nfid/identitykit/react";
import toast from "react-hot-toast";
import { setDiscordUserAccessToken } from "../store/slices/userSlice";
import type { RootState } from "../store/store";
import { getOAuth2URL, getUserData, type UserData } from "../integrations/discord";
import type { Principal } from "@dfinity/principal";
import { useAuthAtlasSpaceActor } from "./identityKit";
import { getDiscordGuilds } from "../canisters/atlasSpace/api";
import type { DiscordGuild as DiscordGuildType } from "../../../declarations/atlas_space/atlas_space.did";

export const useDiscordTask = (spacePrincipal?: Principal) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const accessToken = useSelector((state: RootState) => state.user.accessToken);
  const [discordUser, setDiscordUser] = useState<UserData | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuildType[]>([]);
  const [loading, setLoading] = useState(false);
  const hasFetchedGuilds = useRef(false);
  const hasFetchedUser = useRef(false);

  const authAtlasSpace = spacePrincipal ? useAuthAtlasSpaceActor(spacePrincipal) : null;

  const signInForUser = () => {
    window.open(getOAuth2URL(user?.principal.toString()), "_blank", "width=500,height=600");
  };

  const fetchGuildsForAdmin = useCallback(async () => {
    if (!authAtlasSpace || !accessToken || hasFetchedGuilds.current) return;
    hasFetchedGuilds.current = true;
    setLoading(true);
    try {
      const toastId = toast.loading("Loading Discord guilds...");
      const guilds = await getDiscordGuilds(authAtlasSpace, accessToken);
      setDiscordGuilds(guilds);
      toast.success("Discord guilds loaded!", { id: toastId });
    } catch (err) {
      console.error('Failed to fetch Discord guilds: ', err);
      toast.error('Failed to load Discord guilds.');
      setError('Failed to load Discord guilds.');
    } finally {
      setLoading(false);
    }
  }, [authAtlasSpace, accessToken]);

  const fetchUserData = useCallback(
    async (token: string) => {
      if (hasFetchedUser.current) return;
      hasFetchedUser.current = true;
      setLoading(true);
      try {
        const userData: UserData = await getUserData(token);
        setDiscordUser(userData);
        dispatch(setDiscordUserAccessToken({ accessToken: token }));
        toast.success(`Welcome, ${userData.username}!`);
      } catch (err) {
        console.error('Failed to fetch Discord data: ', err);
        toast.error('Failed to load Discord data.');
        setError('Failed to load Discord data.');
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const { accessToken } = event.data as { accessToken: string };
      if (accessToken) {
        fetchUserData(accessToken);
      }
    },
    [fetchUserData]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  const joinServer = (inviteLink: string) => {
      window.open(inviteLink, "_blank");
    setIsJoined(true);
  };

  return {
    signInForUser,
    fetchGuildsForAdmin,
    accessToken,
    discordUser,
    isJoined,
    joinServer,
    error,
    loading,
    discordGuilds,
  };
};