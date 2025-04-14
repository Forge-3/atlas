import { Actor, type ActorSubclass, type Agent } from "@dfinity/agent";
import { atlas_backend, canisterId, idlFactory } from "../../../declarations/atlas_backend/index.js"
import type { _SERVICE } from "../../../declarations/atlas_backend/atlas_backend.did.ts"

export const authenticatedAtlasBackendActor = (agent: Agent): ActorSubclass<_SERVICE> => {
    return Actor.createActor(idlFactory, {
        agent,
        canisterId
      })
}

export const unAuthenticatedAtlasBackendActor = atlas_backend