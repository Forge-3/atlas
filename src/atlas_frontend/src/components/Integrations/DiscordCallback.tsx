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

    console.log("DISCORD CALLBACK tokenType:", tokenType);
    console.log("DISCORD CALLBACK accessToken:", accessToken);
    console.log("DISCORD CALLBACK state:", state);
    console.log("DISCORD CALLBACK expiresIn:", expiresIn);

    if (
      !tokenType ||
      !accessToken ||
      !expiresIn ||
      state === user?.principal.toString() ||
      !window.opener
    ) {
      console.error(
        "DISCORD CALLBACK ERROR: Missing OAuth parameters OR state mismatch OR opener window closed.",
        { receivedState: state, expectedState: user?.principal.toString(), hasOpener: !!window.opener }
      );
      if (window.opener) {
          window.opener.postMessage({ error: "OAuth processing failed." }, window.location.origin);
      }
      window.close();
      return;
    }

    try {
      window.opener.postMessage(
        { tokenType, accessToken, state, expiresIn },
        window.location.origin
      );
      console.log("DISCORD CALLBACK: Data successfully sent to opener.");
    } catch (err) {
      console.error("DISCORD CALLBACK ERROR: Failed to send message to opener:", err);
    }
    window.close();
  }, [user?.principal]);

  return <></>;
};

export default DiscordCallback;