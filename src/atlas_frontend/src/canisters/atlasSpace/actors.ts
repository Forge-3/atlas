import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import { idlFactory } from "../../../../declarations/atlas_space/index.js";
import type { _SERVICE } from "../../../../declarations/atlas_space/atlas_space.did.js";
import type { Principal } from "@dfinity/principal";

export const atlasSpaceActor = (
  agent: Agent,
  canisterId: Principal
): ActorSubclass<_SERVICE> => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};
