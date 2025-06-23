import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
} from "../../../../declarations/ckusdc_ledger_canister/ckusdc_ledger_canister.did";
import type { Principal } from "@dfinity/principal";
import { unwrapCall } from "../delegatedCall";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { setCkUsdcBalance } from "../../store/slices/userSlice";

interface GetUserSpaceAllowanceArgs {
  unAuthCkUsd: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  userPrincipal: Principal;
}

export const getUserSpaceAllowance = async ({
  unAuthCkUsd,
  spacePrincipal,
  userPrincipal,
}: GetUserSpaceAllowanceArgs) => {
  return await unAuthCkUsd.icrc2_allowance({
    account: {
      owner: userPrincipal,
      subaccount: [],
    },
    spender: {
      owner: spacePrincipal,
      subaccount: [],
    },
  });
};

interface SetUserSpaceAllowanceArgs {
  authCkUsdc: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  amount: bigint;
}

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
    spender: {
      owner: spacePrincipal,
      subaccount: [],
    },
  });
  await unwrapCall<bigint>({
    call,
    errMsg: "Failed to set allowance",
  });
};

interface SetUserSpaceAllowanceIfNeededArgs {
  unAuthCkUsd: ActorSubclass<_SERVICE>;
  authCkUsdc: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  userPrincipal: Principal;
  amount: bigint;
}

export const setUserSpaceAllowanceIfNeeded = async ({
  unAuthCkUsd,
  authCkUsdc,
  spacePrincipal,
  amount,
  userPrincipal,
}: SetUserSpaceAllowanceIfNeededArgs) => {
  const { allowance } = await getUserSpaceAllowance({
    unAuthCkUsd,
    spacePrincipal,
    userPrincipal,
  });
  if (amount < allowance) {
    return;
  }

  await setUserSpaceAllowance({
    authCkUsdc,
    spacePrincipal,
    amount,
  });
};

interface UserBalanceArgs {
  unAuthCkUsdc: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  dispatch: Dispatch<UnknownAction>;
}

export const getUserBalance = async ({
  unAuthCkUsdc,
  userPrincipal,
  dispatch
}: UserBalanceArgs) => {
  const balance = await unAuthCkUsdc.icrc1_balance_of({
    owner: userPrincipal,
    subaccount: []
  });
  dispatch(setCkUsdcBalance(balance));
  return balance
};

interface TransferToPrincipalArgs {
  authCkUsdc: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  amount: bigint
}

export const transferToPrincipal = async ({
  authCkUsdc,
  userPrincipal,
  amount
}: TransferToPrincipalArgs) => {
  return authCkUsdc.icrc1_transfer({
    to: {
      owner: userPrincipal,
      subaccount: []
    },
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    amount
  });
};

