import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE as _SERVICE_MAIN,
  GetSpacesRes,
  Space,
} from "../../../../declarations/atlas_main/atlas_main.did.js";
import type { Principal } from "@dfinity/principal";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { setUserBlockchainData } from "../../store/slices/userSlice.js";
import { unwrapCall } from "../delegatedCall.js";
import { setConfig, setLastFetchTime } from "../../store/slices/appSlice.js";
import { setSpaces } from "../../store/slices/spacesSlice.js";
import type { ExternalLinks } from "../atlasSpace/types.js";
import { setSpaceUsersCount, setUsersCount } from "../../store/slices/statsSlice.js";

const FETCH_INTERVAL_MINUTES = parseInt(process.env.FETCH_INTERVAL_MINUTES!)

const shouldFetchSpaces = (lastFetchTime: string | null): boolean => {
  if (!lastFetchTime) return true;
  const lastFetch = new Date(lastFetchTime);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastFetch.getTime()) / (1000 * 60);
  return diffMinutes >= FETCH_INTERVAL_MINUTES;
};

export { shouldFetchSpaces };
interface CreateNewSpaceArgs {
  authAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  name: string;
  description: string;
  symbol: string | null;
  logo: string | null;
  background: string | null;
  externalLinks: ExternalLinks;
}
export const createNewSpace = async ({
  authAtlasMain,
  name,
  description,
  symbol,
  logo,
  background,
  externalLinks,
}: CreateNewSpaceArgs) => {
  const externalLinksArray = Object.entries(externalLinks).filter(
    (links) => links[1] !== null
  ) as [string, string][];
  const call = authAtlasMain.create_new_space(
    name,
    description,
    symbol ? [symbol] : [],
    logo ? [logo] : [],
    background ? [background] : [],
    { HUB: null },
    externalLinksArray
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
      in_hub: userData.in_hub.pop() ?? null,
      owned_spaces: Array.from(userData.owned_spaces),
      belonging_to_spaces: Array.from(userData.owned_spaces),
    })
  );
};

interface GetAtlasData {
  unAuthAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  dispatch: Dispatch<UnknownAction>;
}

export const getAllSpaces = async ({
  unAuthAtlasMain,
  dispatch,
}: GetAtlasData) => {
  const now = new Date().toISOString();
  dispatch(setLastFetchTime(now));

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

  const spacesList = res.spaces.reduce((acc, val) => {
    return {
      ...acc,
      [val.id.toString()]: null,
    };
  }, {});
  dispatch(setSpaces(spacesList));

  spacesCount = res.spaces_count;
  start += count;

  while (spacesCount < Object.keys(spacesList).length) {
    const call = unAuthAtlasMain.get_spaces({
      start,
      count,
    });
    const res = await unwrapCall<GetSpacesRes>({
      call,
      errMsg: "Failed to get data from blockchain",
    });

    const tempSpacesList = res.spaces.reduce((acc, val) => {
      return {
        ...acc,
        [val.id.toString()]: null,
      };
    }, {});
    dispatch(setSpaces(spacesList));
    Object.assign(spacesList, tempSpacesList);

    start += count;
  }

  return spacesList;
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
        principal: config.ckusdc_ledger.principal,
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

interface PromoteUserToSpaceLead {
  authAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  userId: Principal;
}

export const promoteUserToSpaceLead = async ({
  authAtlasMain,
  userId,
}: PromoteUserToSpaceLead) => {
  const call = authAtlasMain.set_user_space_lead(userId);
  await unwrapCall<null>({
    call,
    errMsg: "Failed to promote user to space lead",
  });
};

interface TransferSpace {
  authAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  toUserId: Principal;
  spaceId: Principal;
}

export const transferSpaceTo = async ({
  authAtlasMain,
  toUserId,
  spaceId,
}: TransferSpace) => {
  const call = authAtlasMain.transfer_space({
    to: toUserId,
    space_id: spaceId,
  });
  await unwrapCall<null>({
    call,
    errMsg: "Failed to transfer space",
  });
};

interface UpgradeSpace {
  authAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  spaceId: Principal;
}

export const upgradeSpace = async ({
  authAtlasMain,
  spaceId,
}: UpgradeSpace) => {
  const call = authAtlasMain.upgrade_space(spaceId);
  await unwrapCall<null>({
    call,
    errMsg: "Failed to upgrade space",
  });
};

interface DeleteSpace {
  authAtlasMain: ActorSubclass<_SERVICE_MAIN>;
  spaceId: Principal;
}

export const deleteSpace = async ({ authAtlasMain, spaceId }: DeleteSpace) => {
  const call = authAtlasMain.delete_space(spaceId);
  await unwrapCall<null>({
    call,
    errMsg: "Failed to delete space",
  });
};

export const getUsersCount = async ({
  unAuthAtlasMain,
  dispatch,
}: GetAtlasData) => {
  const call = unAuthAtlasMain.get_users_count();
  const count = await unwrapCall<bigint>({
    call,
    errMsg: "Failed to get user count",
  });
  dispatch(setUsersCount(count));
};

export const getSpaceUsersCount = async ({
  spaceId,
  unAuthAtlasMain,
  dispatch,
}: { spaceId: Principal } & GetAtlasData) => {
  const call = unAuthAtlasMain.get_space_users_count(spaceId);
  const count = await unwrapCall<bigint>({
    call,
    errMsg: "Failed to get user count",
  });
  dispatch(setSpaceUsersCount({spaceId: spaceId.toString(), count}));
};
