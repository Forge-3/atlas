import { useAgent as useIdentityKitAgent } from "@nfid/identitykit/react";
import { useQuery } from "@tanstack/react-query";
import { ICP_HOST, IS_LOCAL } from "../utils/icp.ts";

export const useAgent = () => {
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
      // The query will not execute until the wallet exists
      enabled: !!tempAgent && IS_LOCAL,
    }
  );

  return agent;
};
