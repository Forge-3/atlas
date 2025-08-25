import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import {
  canisterId as ckUsdcCanisterId,
  idlFactory as ckUsdcIdlFactory,
} from "../../src/declarations/ckusdc_ledger_canister/index.js";
import type { _SERVICE as CkUsdcService } from "../../src/declarations/ckusdc_ledger_canister/ckusdc_ledger_canister.did.js";
import {
  canisterId as atlasMainCanisterId,
  idlFactory as atlasMainIdlFactory,
} from "../../src/declarations/atlas_main/index.js";
import type { _SERVICE as atlasMainService } from "../../src/declarations/atlas_main/atlas_main.did.js";
import { idlFactory as atlasSpaceIdlFactory } from "../../src/declarations/atlas_space/index.js";
import type { _SERVICE as atlasSpaceService } from "../../src/declarations/atlas_space/atlas_space.did.js";
import type { Principal } from "@dfinity/principal";

export const ckUsdcActor = (
  agent: Agent
): ActorSubclass<CkUsdcService> => {
  return Actor.createActor(ckUsdcIdlFactory, {
    agent,
    canisterId: ckUsdcCanisterId,
  });
};

export const atlasMainActor = (
  agent: Agent
): ActorSubclass<atlasMainService> => {

  return Actor.createActor(atlasMainIdlFactory, {
    agent,
    canisterId: atlasMainCanisterId,
  });
};

export const atlasSpaceActor = (
  agent: Agent,
  canisterId: Principal
): ActorSubclass<atlasSpaceService> => {
  return Actor.createActor(atlasSpaceIdlFactory, {
    agent,
    canisterId,
  });
};
