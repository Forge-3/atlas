import React from "react";
import Button from "./Shared/Button.tsx";
import { getOAuth2URL } from "../integrations/discord.ts";
import { useAuth } from "@nfid/identitykit/react";
import toast from "react-hot-toast";

const DiscordButton = () => {
  const { user } = useAuth();

  const handleConnect = () => {
    if (!user?.principal) {
      toast.error("Please connect your wallet first to link Discord.");
      console.warn("Attempted to connect Discord without a connected wallet.");
      return;
    }
    window.open(
      getOAuth2URL(user?.principal.toString()),
      "_blank",
      "width=500,height=600"
    );
  };

  return <Button onClick={handleConnect}>Sign in with Discord</Button>;
};

export default DiscordButton;
