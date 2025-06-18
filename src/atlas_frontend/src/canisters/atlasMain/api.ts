import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE as _SERVICE_MAIN,
  GetSpacesRes,
  Space,
} from "../../../../declarations/atlas_main/atlas_main.did.js";
import type { Principal } from "@dfinity/principal";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import {
  setIsUserInHub,
  setUserBlockchainData,
} from "../../store/slices/userSlice.js";
import { unwrapCall } from "../delegatedCall.js";
import { setConfig } from "../../store/slices/appSlice.js";
import type { _SERVICE as _SERVICE_SPACE } from "../../../../declarations/atlas_space/atlas_space.did.js";
import { setSpaces } from "../../store/slices/spacesSlice.js";
import { customSerify } from "../../store/store.js";
import { deserify, serify } from "@karmaniverous/serify-deserify";

interface CreateNewSpaceArgs {
  authAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  name: string;
  description: string;
  symbol: string | null;
  logo: string | null;
  background: string | null;
}
export const createNewSpace = async ({
  authAtlasMain,
  name,
  description,
  symbol,
  logo,
  background,
}: CreateNewSpaceArgs) => {
  const call = authAtlasMain.create_new_space(
    name,
    description,
    symbol ? [symbol] : [],
    logo ? [logo] : [],
    background ? [background] : [],
    { HUB: null }
  );

  return unwrapCall<Space>({
    call,
    errMsg: "Failed to get data from blockchain",
  });
};

interface GetAtlasUserArgs {
  unAuthAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  userId: Principal;
  dispatch: Dispatch<UnknownAction>;
}

export const getAtlasUser = async ({
  unAuthAtlasMain,
  userId,
  dispatch,
}: GetAtlasUserArgs) => {
  const userData = await unAuthAtlasMain.get_user({
    Principal: userId,
  });

  dispatch(
    setUserBlockchainData({
      ...userData,
      owned_spaces: Array.from(userData.owned_spaces),
      belonging_to_spaces: Array.from(userData.owned_spaces),
    })
  );
};

export const getAtlasUserIsInHub = async ({
  unAuthAtlasMain,
  userId,
  dispatch,
}: GetAtlasUserArgs) => {
  const isInHub = await unAuthAtlasMain.get_user_hub(userId);
  const principal = isInHub.pop()?.id;
  if (principal) {

    dispatch(setIsUserInHub(principal.toString()));
  } else {
    dispatch(setIsUserInHub(null));
  }
};

interface GetAtlasData {
  unAuthAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  dispatch: Dispatch<UnknownAction>;
}

export const getAllSpaces = async ({
  unAuthAtlasMain,
  dispatch,
}: GetAtlasData) => {
  const spaces: Space[] = [];
  let spacesCount = 0n;
  let start = 0n;
  const count = 200n;
  const call = unAuthAtlasMain.get_spaces({
    start,
    count,
  });
  const res = await unwrapCall<GetSpacesRes>({
    call,
    errMsg: "Failed to get data from blockchain",
  });
  spacesCount = res.spaces_count;
  spaces.push(...res.spaces);
  start += count;

  while (spacesCount < spaces.length) {
    const call = unAuthAtlasMain.get_spaces({
      start,
      count,
    });
    const res = await unwrapCall<GetSpacesRes>({
      call,
      errMsg: "Failed to get data from blockchain",
    });
    spaces.push(...res.spaces);
    start += count;
  }
  const spacesList = spaces.reduce((acc, val) => {
    return {
      ...acc,
      [val.id.toString()]: null,
    };
  }, {});

  dispatch(setSpaces(spacesList));
};

export const getAtlasConfig = async ({
  unAuthAtlasMain,
  dispatch,
}: GetAtlasData) => {
  const config = await unAuthAtlasMain.app_config();
  dispatch(
    setConfig({
      ...config,
      ckusdc_ledger: {
        fee: config.ckusdc_ledger.fee.pop() ?? null,
        principal: config.ckusdc_ledger.principal.toText(),
      },
    })
  );
};

interface JoinAtlasSpaceArgs {
  authAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  space: Principal;
}
export const joinAtlasSpace = async ({
  authAtlasMain,
  space,
}: JoinAtlasSpaceArgs) => {
  const call = authAtlasMain.join_space(space);
  await unwrapCall<null>({
    call,
    errMsg: "Failed to join space",
  });
};
