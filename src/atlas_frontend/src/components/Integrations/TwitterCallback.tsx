import { useEffect } from "react";

const TwitterCallback = () => {
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const payload = {
      type: "x-oauth2-callback",
      code: qs.get("code") || undefined,
      state: qs.get("state") || undefined,
      error: qs.get("error") || undefined,
      error_description: qs.get("error_description") || undefined,
    };

    try {
      if (window.opener && window.opener !== window) {
        window.opener.postMessage(payload, window.location.origin);
        setTimeout(() => window.close(), 50);
      } else {
        sessionStorage.setItem("x_oauth_payload", JSON.stringify(payload));
        window.location.replace("/");
      }
    } catch {
      window.location.replace("/");
    }
  }, []);
  return null;
};
export default TwitterCallback;