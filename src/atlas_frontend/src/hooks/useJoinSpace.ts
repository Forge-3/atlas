import toast from "react-hot-toast";
import { runWithLoading } from "../utils/loading";
import { getAtlasUser, joinAtlasSpace } from "../canisters/atlasMain/api";
import { useAuthAtlasMainActor, useUnAuthAtlasMainActor } from "./identityKit";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch } from "react-redux";
import { getErrorWithInfoToast } from "../utils/errors";
import type { Principal } from "@dfinity/principal";

export const useJoinSpace = (spacePrincipal: Principal) => {
    const { user } = useAuth();
    const dispatch = useDispatch();
    const authAtlasMain = useAuthAtlasMainActor();
    const unAuthAtlasMain = useUnAuthAtlasMainActor();

const joinSpace = async () => {
    if (!authAtlasMain || !unAuthAtlasMain || !user) {
      return;
    }

    await runWithLoading(async () => {
      await toast.promise(
        joinAtlasSpace({
          authAtlasMain,
          space: spacePrincipal,
        }),
        {
          loading: "Trying to join space...",
          success: "Successfully joined to space.",
          error: getErrorWithInfoToast("Failed to join to space."),
        }
      );
      getAtlasUser({
        unAuthAtlasMain,
        dispatch,
        userId: user.principal,
      });
    }, dispatch);
  };
  return { joinSpace };
}

export default useJoinSpace;