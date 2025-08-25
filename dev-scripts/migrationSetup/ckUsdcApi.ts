import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../src/declarations/ckusdc_ledger_canister/ckusdc_ledger_canister.did";
import type { Principal } from "@dfinity/principal";
import { unwrapCall } from "../../src/atlas_frontend/src/canisters/delegatedCall.ts";

export interface GetUserSpaceAllowanceArgs {
  unAuthCkUsd: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  userPrincipal: Principal;
}

export interface SetUserSpaceAllowanceArgs {
  authCkUsdc: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  amount: bigint;
}

export interface SetUserSpaceAllowanceIfNeededArgs {
  unAuthCkUsd: ActorSubclass<_SERVICE>;
  authCkUsdc: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  userPrincipal: Principal;
  amount: bigint;
}

export const getUserSpaceAllowance = async ({
  unAuthCkUsd,
  spacePrincipal,
  userPrincipal,
}: GetUserSpaceAllowanceArgs) => {
  return await unAuthCkUsd.icrc2_allowance({
    account: { owner: userPrincipal, subaccount: [] },
    spender: { owner: spacePrincipal, subaccount: [] },
  });
};

export const setUserSpaceAllowance = async ({
  authCkUsdc,
  spacePrincipal,
  amount,
}: SetUserSpaceAllowanceArgs) => {
  const call = authCkUsdc.icrc2_approve({
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    amount,
    expected_allowance: [],
    expires_at: [],
    spender: { owner: spacePrincipal, subaccount: [] },
  });
  return unwrapCall({ call, errMsg: "Failed to set allowance" });
};

export const setUserSpaceAllowanceIfNeeded = async ({
  unAuthCkUsd,
  authCkUsdc,
  spacePrincipal,
  userPrincipal,
  amount,
}: SetUserSpaceAllowanceIfNeededArgs) => {
  const { allowance } = await getUserSpaceAllowance({ unAuthCkUsd, spacePrincipal, userPrincipal });
  if (allowance >= amount) return;
  await setUserSpaceAllowance({ authCkUsdc, spacePrincipal, amount });
};
