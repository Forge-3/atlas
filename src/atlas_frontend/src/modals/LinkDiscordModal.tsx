import React, { useEffect } from "react";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch, useSelector } from "react-redux";
import { setScreenBlur } from "../store/slices/appSlice.ts";
import Button from "../components/Shared/Button.tsx";
import {
  getOAuth2URL,
  getGuildsData,
  type UserData,
} from "../integrations/discord.ts";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { setDiscordIntegrationData, clearDiscordIntegrationData, selectUserDiscordData } from "../store/slices/userSlice";
import { useAuthAtlasMainActor } from "../hooks/identityKit.ts";

const GUILD_ID = "1359198898752852110";

const LastStep = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { disconnect, user } = useAuth();
  const userDiscordData = useSelector(selectUserDiscordData);

  const authenticatedAtlasMain = useAuthAtlasMainActor();

  const disconnectWallet = () => {
    dispatch(setScreenBlur(false));
    dispatch(clearDiscordIntegrationData());
    localStorage.removeItem("discordUserAccessToken");
    localStorage.removeItem("discordUserData");
    disconnect();
    navigate("/");
  };

  const openOAuthTab = () => {
    window.open(getOAuth2URL(user?.principal.toString()), "_blank");
  };

  const postDiscordLogin = async (accessToken: string) => {
    let userData: null | UserData = null;
    try {
      userData = await getGuildsData(accessToken);
    } catch (_err) {
      toast.error("Failed to get Discord data from Discord API.");
      return;
    }

    if (!authenticatedAtlasMain) {
      toast.error("Session expired. Please log in again.");
      navigate("/");
      return;
    }
    const { tokenType, state, expiresIn } = userDiscordData || {};

    dispatch(setDiscordIntegrationData({
      tokenType: tokenType || "",
      accessToken: accessToken,
      state: state || "",
      expiresIn: expiresIn || 0,
      guildId: GUILD_ID,
      userData: userData
    }));

    navigate("/space");
    dispatch(setScreenBlur(false));
    toast.success("Successfully linked Discord");
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{
      tokenType?: string;
      accessToken?: string;
      state?: string;
      expiresIn?: string;
    }>) => {
      if (event.origin !== window.location.origin) return;
      const { tokenType, accessToken, state, expiresIn } = event.data;

      if (!tokenType || !accessToken || !expiresIn || !state) {
        toast.error("Missing Discord authentication data.");
        return;
      }
      if (state !== user?.principal.toString()) {
        toast.error("Failed to authenticate with Discord: State mismatch.");
        return;
      }
      postDiscordLogin(accessToken); 
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [authenticatedAtlasMain, user?.principal, dispatch]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="flex flex-col rounded-xl bg-white p-[20px] gap-[10px]">
        <h2 className="flex items-center justify-between font-semibold font-montserrat">
          Join 
        </h2>
        <p className="mb-6 text-gray-600">
          Connect your discord account to find corresponding HUB
        </p>
        <Button onClick={openOAuthTab} className="w-full">
          Sign in with Discord
        </Button>
        <Button
          onClick={disconnectWallet}
          className="w-full bg-[#1E0F33]/50"
          light={true}
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
};

export default LastStep;