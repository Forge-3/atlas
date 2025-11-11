import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { openTwitterLoginPopup } from "../components/Integrations/twitter/twitter";
import { exchange_code_for_token, fetch_x_post_likes, fetch_x_post_retweets, fetch_x_user_info } from "../canisters/atlasSpace/api";
import { useAuthAtlasSpaceActor } from "./identityKit";
import { useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../../declarations/atlas_space/atlas_space.did";

export type TweetActivityType = "Like" | "Retweet";

export type XUser = {
  data: {
    id: string;
    name: string;
    username: string;
    created_at: string;
  };
}

interface User {
  id: string;
  name: string;
  username: string;
}

export type UsersResponse = {
  data: User[];
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

  const getTweetActivity = useCallback(async (
    authAtlasSpace: ActorSubclass<_SERVICE>,
    accessToken: string,
    postId: string,
    taskType: TweetActivityType
    ) => {
    if (!authAtlasSpace) {
      toast.error("Authentication details are missing.");
      return null;
    }
    setLoading(true);

    const args = {
          authAtlasSpace: authAtlasSpace,
          accessToken,
          postId
        };

    try {
      let response: String | null = null;

      if (taskType === "Like") {
        response = await fetch_x_post_likes(args);
      } else if (taskType === "Retweet") {
        response = await fetch_x_post_retweets(args);
      } else {
        console.error("Invalid task type:", taskType);
        toast.error("Invalid task type specified.");
        setLoading(false);
        return null;
      }
      return response;
    } catch (err) {
      console.error(`Failed to fetch post ${taskType}:`, err);
      toast.error(`Failed to fetch post ${taskType}. Please try again.`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authAtlasSpace]);

  return {
    signIn,
    fetchXUserInfo,
    getTweetActivity,
    xUser,
    loading,
    loggedIn,
    accessToken,
  };
};