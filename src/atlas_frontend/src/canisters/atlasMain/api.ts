import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE, Space } from "../../../../declarations/atlas_main/atlas_main.did.js";
import { toast } from "react-hot-toast";
import { formatErrorMsg } from "../errors.js";
import type { Principal } from "@dfinity/principal";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { setUserBlockchainData } from "../../store/slices/userSlice.js";
import { unwrapCall } from "../delegatedCall.js";

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
  const call = authenticatedAtlasMain.create_new_space(
    name,
    description,
    symbol ? [symbol] : [],
    logo ? [logo] : [],
    background ? [background] : []
  )
  const promise = unwrapCall<Space>({call, errMsg: "Failed to get data from blockchain"})

  const space = await toast.promise(promise, {
    loading: "Creating new space...",
    success: "Space created successfully",
    error: "Failed to create space",
  });

  return space?.id ?? null
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
  const userData = await unAuthAtlasMain.get_user({
    Principal: userId
  });
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

interface GetAtlasSpaces {
  unAuthAtlasMain: ActorSubclass<_SERVICE>;
  dispatch: Dispatch<UnknownAction>;
}

export const getAllSpaces  = async ({
  unAuthAtlasMain,
  dispatch,
}: GetAtlasSpaces) => {
  let start = 0n
  const count = 200n
  const spaces = await unAuthAtlasMain.get_spaces({
    start,
    count
  });
}