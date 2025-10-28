import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import {
  canisterId,
  idlFactory,
} from "../../../../declarations/ckusdc_index_canister/index.js";
import type { _SERVICE } from "../../../../declarations/ckusdc_index_canister/ckusdc_index_canister.did.js";

export const ckUsdcIndexActor = (
  agent: Agent
): ActorSubclass<_SERVICE> => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};
