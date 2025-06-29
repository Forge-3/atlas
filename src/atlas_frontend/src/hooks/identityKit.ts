import { useAgent as useIdentityKitAgent } from "@nfid/identitykit/react";
import { useQuery } from "@tanstack/react-query";
import { ICP_HOST, IS_LOCAL } from "../utils/icp.ts";
import { useMemo } from "react";
import { atlasMainActor } from "../canisters/atlasMain/actors.ts";
import { HttpAgent } from "@dfinity/agent";
import { atlasSpaceActor } from "../canisters/atlasSpace/actors.ts";
import type { Principal } from "@dfinity/principal";
import { ckUSDCActor } from "../canisters/ckUSDC/actors.ts";

export const useAuthAgent = () => {
  const tempAgent = useIdentityKitAgent({
    host: ICP_HOST,
  }) ?? null;

  const { data: agent } = useQuery(
    ["user", tempAgent],
    async () => {
      await tempAgent?.fetchRootKey();
      return tempAgent ?? null;
    },
    {
      enabled: !!tempAgent && IS_LOCAL,
    }
  );

  return useMemo(() => agent ?? null, [agent]);
};

export const useUnAuthAgent = () => {
  const tempAgent = HttpAgent.createSync()

  const { data: agent } = useQuery(
    ["user", tempAgent],
    async () => {
      await tempAgent?.fetchRootKey();
      return tempAgent?? null;
    },
    {
      enabled: !!tempAgent && IS_LOCAL,
    }
  );

  return useMemo(() => agent ?? null, [agent]);
};

export const useAuthAtlasMainActor = () => {
  const agent = useAuthAgent();
  return agent && atlasMainActor(agent)
};

export const useUnAuthAtlasMainActor = () => {
  const agent = useUnAuthAgent();
  return agent && atlasMainActor(agent)
};

export const useAuthCkUSDCActor = () => {
  const agent = useAuthAgent();
  return agent && ckUSDCActor(agent)
};

export const useUnAuthCkUSDCActor = () => {
  const agent = useUnAuthAgent();
  return agent && ckUSDCActor(agent)
};

export const useAuthAtlasSpaceActor = (canisterId: Principal) => {
  const agent = useAuthAgent();
  return agent && atlasSpaceActor(agent, canisterId)
};

export const useUnAuthAtlasSpaceActor = (canisterId: Principal)  => {
  const agent = useUnAuthAgent();
  return agent && atlasSpaceActor(agent, canisterId)
};

export const getUnAuthAtlasSpaceActor = (agent: HttpAgent, canisterId: Principal)  => {
  return atlasSpaceActor(agent, canisterId)
};