import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@nfid/identitykit/react";
import toast from "react-hot-toast";
import { setDiscordUserAccessToken } from "../store/slices/userSlice";
import type { RootState } from "../store/store";
import { getOAuth2URL, getUserData, type UserData } from "../components/Integrations/discord/discord";

export const useDiscordAuth = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const accessToken = useSelector((state: RootState) => state.user.accessToken);
  const [discordUser, setDiscordUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = () => {
    window.open(getOAuth2URL(user?.principal.toString()), "_blank", "width=500,height=600");
  };

  const fetchUserData = useCallback(
    async (token: string) => {
      setLoading(true);
      try {
        const userData: UserData = await getUserData(token);
        setDiscordUser(userData);
        dispatch(setDiscordUserAccessToken({ accessToken: token }));
        toast.success(`Welcome, ${userData.username}!`, { id: "discord-welcome" });
      } catch (err) {
        console.error('Failed to fetch Discord data: ', err);
        toast.error('Failed to load Discord data.');
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

  return {
    signIn,
    accessToken,
    discordUser,
    isAuthenticated: !!accessToken,
    loading,
  };
}; 