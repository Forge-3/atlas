import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import {
  atlas_main,
  canisterId,
  idlFactory,
} from "../../../../declarations/atlas_main/index.js";
import type { _SERVICE } from "../../../../declarations/atlas_main/atlas_main.did.js";

export const authenticatedAtlasMainActor = (
  agent: Agent
): ActorSubclass<_SERVICE> => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};

export const unAuthenticatedAtlasMainActor: ActorSubclass<_SERVICE> = atlas_main;
