import React, { useEffect } from "react";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch } from "react-redux";
import { setScreenBlur } from "../store/slices/appSlice.ts";
import Button from "../components/Shared/Button.tsx";
import {
  getOAuth2URL,
  getUserData,
  type UserData,
} from "../integrations/discord.ts";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  setUserDiscordAccessToken,
  setUserDiscordData,
} from "../store/slices/userSlice.ts";
import { useAuthAtlasMainActor } from "../hooks/identityKit.ts";

const LastStep = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { disconnect, user } = useAuth();

  const authenticatedAtlasMain = useAuthAtlasMainActor()

  const disconnectWallet = () => {
    dispatch(setScreenBlur(false));
    disconnect();
  };

  const openOAuthTab = () => {
    window.open(getOAuth2URL(user?.principal.toString()), "_blank");
  };

  const postDiscordLogin = async (accessToken: string) => {
    let userData: null | UserData = null;
    try {
      userData = await getUserData(accessToken);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      toast.error("Failed to get Discord data");
      return;
    }

    if (!authenticatedAtlasMain) {
      toast.error("Session expired");
      navigate("/");
      return <></>;
    }

    try {
      //await authenticatedAtlasMain.register_user(accessToken);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      toast.error("Failed to register user");
      navigate("/");
      return <></>;
    }
    dispatch(setUserDiscordAccessToken(accessToken));
    dispatch(setUserDiscordData(userData));
    navigate("/space");
    dispatch(setScreenBlur(false));
    toast.success("Successfully linked Discord");
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMessage = (event: any) => {
      if (event.origin !== window.location.origin) return;
      const { tokenType, accessToken, state, expiresIn } = event.data;

      if (!tokenType || !accessToken || !expiresIn || !state) {
        return;
      }
      if (state !== user?.principal.toString()) {
        toast.error("Failed to authenticate with Discord");
        return;
      }

      postDiscordLogin(accessToken);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [authenticatedAtlasMain]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
