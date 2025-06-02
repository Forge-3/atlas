import React, { useEffect } from "react";
import { useAuth } from "@nfid/identitykit/react";

const DiscordCallback = () => {
  const { user } = useAuth();

  useEffect(() => {
    const query = new URLSearchParams(window.location.hash.substring(1));
    const tokenType = query.get("token_type");
    const accessToken = query.get("access_token");
    const state = query.get("state");
    const expiresIn = query.get("expires_in");

    if (
      !tokenType ||
      !accessToken ||
      !expiresIn ||
      state === user?.principal.toString() ||
      !window.opener
    ) {
      return
    }

    try {
      window.opener.postMessage(
        { tokenType, accessToken, state, expiresIn },
        window.location.origin
      );
    } catch (err) {
      console.error("Failed to send msg:", err);
    }
    window.close();
  }, []);

  return <></>;
};

export default DiscordCallback;
