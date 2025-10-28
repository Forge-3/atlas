import type { SubAccount } from "@dfinity/ledger-icp";
import type { Principal } from "@dfinity/principal";
import { useIsInitializing } from "@nfid/identitykit/react";
import { useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";

interface UseSpaceIdParams {
  user:
    | {
        principal: Principal;
        subAccount?: SubAccount;
      }
    | undefined;
  navigate: NavigateFunction;
}

export const authGuard = ({ user, navigate }: UseSpaceIdParams) => {
    const initializing = useIsInitializing()
     useEffect(() => {
        if (initializing) return;
        if (!user?.principal) {
            navigate("/");
        }
    }, [user, initializing, navigate]);
};
