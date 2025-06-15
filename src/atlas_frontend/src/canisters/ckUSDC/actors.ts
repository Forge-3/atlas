import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import {
  canisterId,
  idlFactory,
} from "../../../../declarations/ckusdc_canister/index.js";
import type { _SERVICE } from "../../../../declarations/ckusdc_canister/ckusdc_canister.did.js";

export const ckUSDCActor = (
  agent: Agent
): ActorSubclass<_SERVICE> => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};
