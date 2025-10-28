import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import {
  canisterId,
  idlFactory,
} from "../../../../declarations/ckusdc_ledger_canister/index.js";
import type { _SERVICE } from "../../../../declarations/ckusdc_ledger_canister/ckusdc_ledger_canister.did.js";

export const ckUsdcActor = (
  agent: Agent
): ActorSubclass<_SERVICE> => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};
