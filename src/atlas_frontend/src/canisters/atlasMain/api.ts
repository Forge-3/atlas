import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../../../declarations/atlas_main/atlas_main.did.js";
import { toast } from "react-hot-toast";
import { formatErrorMsg } from "./errors";
import type { Principal } from "@dfinity/principal";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { setUserBlockchainData } from "../../store/slices/userSlice.js";

interface CreateNewSpaceArgs {
  authenticatedAtlasMain: ActorSubclass<_SERVICE>;
  name: string;
  description: string;
  symbol: string | null;
  logo: string | null;
  background: string | null;
}
export const createNewSpace = async ({
  authenticatedAtlasMain,
  name,
  description,
  symbol,
  logo,
  background,
}: CreateNewSpaceArgs) => {
  const promise = new Promise<Principal>(async (res, rej) => {
    const userData = await authenticatedAtlasMain.create_new_space(
      name,
      description,
      symbol ? [symbol] : [],
      logo ? [logo] : [],
      background ? [background] : []
    ).catch(err => {
      console.error(err)
      rej("Failed to create new space")
    });
    if (!userData) return rej("Failed to create new space")

    if ("Ok" in userData) {
      res(userData.Ok.id);
    } else if ("Err" in userData) {
      console.error(userData.Err);
      rej(formatErrorMsg(userData.Err));
    }
  });

  return toast.promise(promise, {
    loading: "Creating new space...",
    success: "Space created successfully",
    error: "Failed to create space",
  });
};

interface GetAtlasUserArgs {
  unAuthAtlasMain: ActorSubclass<_SERVICE>;
  userId: Principal;
  dispatch: Dispatch<UnknownAction>;
}

export const getAtlasUser = async ({
  unAuthAtlasMain,
  userId,
  dispatch,
}: GetAtlasUserArgs) => {
  const userData = await unAuthAtlasMain.get_user(userId);
  if (!userData) {
    toast.error("Failed to get user data from ICP");
    return;
  }
  dispatch(
    setUserBlockchainData({
      ...userData,
      owned_spaces: Array.from(userData.owned_spaces),
    })
  );
};
