import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { openTwitterLoginPopup } from "../components/Integrations/twitter/twitter.ts";
import { exchange_code_for_token } from "../canisters/atlasSpace/api";
import { useAuthAtlasSpaceActor } from "./identityKit";
import { useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";

type XUser = {
  data: {
    id: string;
    name: string;
    username: string;
    created_at: string;
  };
}

export const useTwitterAuth = () => {
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { spacePrincipal } = useParams();

  const parsedSpacePrincipal = spacePrincipal
      ? Principal.from(spacePrincipal)
      : null;
  const authAtlasSpace = parsedSpacePrincipal
      ? useAuthAtlasSpaceActor(parsedSpacePrincipal)
      : null;

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const { code, codeVerifier } = await openTwitterLoginPopup({
        clientId: import.meta.env.PUBLIC_X_CLIENT_ID,
        redirectUri: import.meta.env.PUBLIC_X_REDIRECT_URI,
        scope: import.meta.env.PUBLIC_X_SCOPE
      });
    console.log("Received code from X:", code);
    if (parsedSpacePrincipal) {
      console.log("authAtlasSpace", authAtlasSpace);
      if (!authAtlasSpace) throw new Error("authAtlasSpace is not initialized");
      const rawUserJsonString = await exchange_code_for_token({
        authAtlasSpace: authAtlasSpace,
        code,
        codeVerifier
      });
      if (typeof rawUserJsonString === 'string' && rawUserJsonString.startsWith("HTTP Error")) {
        throw new Error("Backend returned an error while retrieving user data.");
      }
      const userResponse: XUser = JSON.parse(rawUserJsonString as string);

      if (!userResponse) {
        throw new Error("No user data in API X response.");
      }

      const finalXUser: XUser = {
        data: {
          id: userResponse.data.id,
          name: userResponse.data.name,
          username: userResponse.data.username,
          created_at: userResponse.data.created_at,
        },
      };
      setXUser(finalXUser);

      console.log("Successfully logged in and retrieved user X's data.");
      console.log("Full user object:", finalXUser);
      console.log("Username:", finalXUser.data.username);
      console.log("Created at:", finalXUser.data.created_at);

      toast.success("Logged in to X successfully. Hi " + finalXUser.data.username + "!");
    }

    } catch (err) {
      console.error("Twitter auth error:", err);
      toast.error("Login to X failed.");
      setXUser(null);
      setLoading(false);
    }
  }, [authAtlasSpace]);

  return {
    signIn,
    xUser,
    loading,
  };
};