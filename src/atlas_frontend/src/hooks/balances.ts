import { useQuery } from "@tanstack/react-query";
import { useUnAuthCkUsdcLedgerActor } from "./identityKit";
import { useAuth } from "@nfid/identitykit/react";
import { getUserBalance } from "../canisters/ckUsdcLedger/api";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { setCkUsdcBalance } from "../store/slices/userSlice";

interface GetCkUsdcBalance {
  dispatch: Dispatch<UnknownAction>;
}

export const getCkUsdcBalance = ({ dispatch }: GetCkUsdcBalance) => {
  const unAuthCkUsdcActor = useUnAuthCkUsdcLedgerActor();
  const { user } = useAuth();

  useQuery(
    ["user", unAuthCkUsdcActor, user],
    async () => {
      if (!user?.principal) return null;
      const userCkUsdc = await getUserBalance({
        unAuthCkUsdc: unAuthCkUsdcActor,
        userPrincipal: user?.principal,
        dispatch
      });
      return userCkUsdc
    },
    {
      enabled: !!user?.principal && !!unAuthCkUsdcActor,
    }
  );
};
