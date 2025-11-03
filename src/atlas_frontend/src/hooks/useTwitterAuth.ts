import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { openTwitterLoginPopup } from "../components/Integrations/twitter/twitter";
import { exchange_code_for_token, fetch_x_post_likes, fetch_x_user_info } from "../canisters/atlasSpace/api";
import { useAuthAtlasSpaceActor } from "./identityKit";
import { useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";

export type XUser = {
  data: {
    id: string;
    name: string;
    username: string;
    created_at: string;
  };
}

interface LikingUser {
  id: string;
  name: string;
  username: string;
}

export type LikingUsersResponse = {
  data: LikingUser[];
}

export const useTwitterAuth = () => {
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { spacePrincipal } = useParams();

  const parsedSpacePrincipal = spacePrincipal
      ? Principal.from(spacePrincipal)
      : null;
  const authAtlasSpace = parsedSpacePrincipal
      ? useAuthAtlasSpaceActor(parsedSpacePrincipal)
      : null;

  const signIn = useCallback(async () => {
    setLoading(true);
    let token: string | null = null;
    try {
      const { code, codeVerifier } = await openTwitterLoginPopup({
        clientId: import.meta.env.PUBLIC_X_CLIENT_ID,
        redirectUri: import.meta.env.PUBLIC_X_REDIRECT_URI,
        scope: import.meta.env.PUBLIC_X_SCOPE
      });

    if (parsedSpacePrincipal) {
      if (!authAtlasSpace) throw new Error("authAtlasSpace is not initialized");

      const tokenResponseString = await exchange_code_for_token({
          authAtlasSpace: authAtlasSpace,
          code,
          codeVerifier
        });
        
        if (typeof tokenResponseString === 'string' && tokenResponseString.startsWith("HTTP Error")) {
          throw new Error("Backend returned an error during token exchange.");
        }
        
        token = tokenResponseString as string;

        if (!token) {
          throw new Error("No access_token found in the token response.");
        }

        setAccessToken(token);
        setLoggedIn(true);
        toast.success("Successfully authenticated with X!");
      }
    } catch (err) {
      console.error("Twitter auth error:", err);
      toast.error("Login to X failed.");
      setXUser(null);
      setAccessToken(null);
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
    return token;
  }, [authAtlasSpace]);

  const fetchXUserInfo = useCallback(async (accessToken: string) => {
    if (!authAtlasSpace) {
      toast.error("Authentication details are missing.");
      return null;
    }
    setLoading(true);
    try {
      const rawUserJsonString = await fetch_x_user_info({
        authAtlasSpace: authAtlasSpace,
        accessToken
      });

    if (typeof rawUserJsonString === 'string' && rawUserJsonString.startsWith("HTTP Error")) {
      throw new Error("Backend returned an error during user info fetch.");
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
      toast.success("Logged in to X successfully. Hi " + finalXUser.data.username + "!");
      return finalXUser;
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      toast.error("Failed to fetch user info.");
      setXUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authAtlasSpace]);

  const getPostLikes = useCallback(async (accessToken: string, postId: string) => {
    if (!authAtlasSpace) {
      toast.error("Authentication details are missing.");
      return null;
    }
    setLoading(true);
    try {
      const likesResponse = await fetch_x_post_likes({
        authAtlasSpace: authAtlasSpace,
        accessToken,
        postId});
      
      console.log("Fetched post likes:", likesResponse);
      setLoading(false);
      return likesResponse;
    } catch (err) {
      console.error("Failed to fetch post likes:", err);
      toast.error("Failed to fetch post likes. Please try again.");
      setLoading(false);
      return null;
    }
  }, [authAtlasSpace]);

  return {
    signIn,
    fetchXUserInfo,
    getPostLikes,
    xUser,
    loading,
    loggedIn,
    accessToken,
  };
};