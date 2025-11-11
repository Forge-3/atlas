import React, { useEffect } from "react";

const DiscordCallback = () => {

  useEffect(() => {
    const query = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = query.get("access_token");

    if (
      !accessToken ||
      !window.opener
    ) {
      return
    }

    try {
      window.opener.postMessage(
        { accessToken },
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
