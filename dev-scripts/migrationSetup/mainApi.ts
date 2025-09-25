import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE as AtlasMainService,
  Space,
} from "../../src/declarations/atlas_main/atlas_main.did";
import { unwrapCall } from "../../src/atlas_frontend/src/canisters/delegatedCall.ts";
import type { Principal } from "@dfinity/principal";

interface ExternalLinks {
  x: string | null;
  telegram: string | null;
  discord: string | null;
  linkedIn: string | null;
}

interface CreateNewSpaceArgs {
  authAtlasMain: ActorSubclass<AtlasMainService>;
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

  return await unwrapCall<Space>({
    call,
    errMsg: "Failed to create new space",
  });
};

interface TransferSpaceArgs {
  authAtlasMain: ActorSubclass<AtlasMainService>;
  toUserId: Principal;
  spaceId: Principal;
}

export const transferSpaceTo = async ({
  authAtlasMain,
  toUserId,
  spaceId,
}: TransferSpaceArgs) => {
  const call = authAtlasMain.transfer_space({
    to: toUserId,
    space_id: spaceId,
  });

  return await unwrapCall<null>({
    call,
    errMsg: "Failed to transfer space",
  });
};

interface JoinAtlasSpaceArgs {
  authAtlasMain: ActorSubclass<AtlasMainService>;
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
