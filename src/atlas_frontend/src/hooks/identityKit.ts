import { useAgent as useIdentityKitAgent } from "@nfid/identitykit/react";
import { useQuery } from "@tanstack/react-query";
import { ICP_HOST, IS_LOCAL } from "../utils/icp.ts";
import { useMemo } from "react";
import { authenticatedAtlasMainActor } from "../canisters/atlasMain/actors.ts";
import { atlas_main } from "../../../declarations/atlas_main/index.js";
import { HttpAgent } from "@dfinity/agent";
import { atlasSpaceActor } from "../canisters/atlasSpace/actors.ts";
import type { Principal } from "@dfinity/principal";

export const useAuthAgent = () => {
  const tempAgent = useIdentityKitAgent({
    host: ICP_HOST,
  });

  const { data: agent } = useQuery(
    ["user", tempAgent],
    async () => {
      await tempAgent?.fetchRootKey();
      return tempAgent;
    },
    {
      enabled: !!tempAgent && IS_LOCAL,
    }
  );

  return agent;
};

export const useUnAuthAgent = () => {
  const tempAgent = HttpAgent.createSync()

  const { data: agent } = useQuery(
    ["user", tempAgent],
    async () => {
      await tempAgent?.fetchRootKey();
      return tempAgent;
    },
    {
      enabled: !!tempAgent && IS_LOCAL,
    }
  );

  return agent;
};

export const useAuthenticatedAtlasMainActor = () => {
  const agent = useAuthAgent();

  return useMemo(() => agent && authenticatedAtlasMainActor(agent), [agent]);
};

export const useUnAuthenticatedAtlasMainActor = () => {
  const agent = useUnAuthAgent();

  return useMemo(() => agent && authenticatedAtlasMainActor(agent), [agent]);
};

export const useAuthenticatedAtlasSpaceActor = (canisterId: Principal) => {
  const agent = useAuthAgent();

  return useMemo(() => agent && atlasSpaceActor(agent, canisterId), [agent]);
};

export const useUnAuthenticatedAtlasSpaceActor = (canisterId: Principal)  => {
  const agent = useUnAuthAgent();

  return useMemo(() => agent && atlasSpaceActor(agent, canisterId), [agent]);
};