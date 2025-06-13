import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
} from "../../../../declarations/ckusdc_canister/ckusdc_canister.did";
import type { Principal } from "@dfinity/principal";
import { unwrapCall } from "../delegatedCall";

interface GetUserSpaceAllowanceArgs {
  unAuthCkUSD: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  userPrincipal: Principal;
}

export const getUserSpaceAllowance = async ({
  unAuthCkUSD,
  spacePrincipal,
  userPrincipal,
}: GetUserSpaceAllowanceArgs) => {
  return await unAuthCkUSD.icrc2_allowance({
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
  authCkUSDC: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  amount: bigint;
}

export const setUserSpaceAllowance = async ({
  authCkUSDC,
  spacePrincipal,
  amount,
}: SetUserSpaceAllowanceArgs) => {
  const call = authCkUSDC.icrc2_approve({
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
  unAuthCkUSD: ActorSubclass<_SERVICE>;
  authCkUSDC: ActorSubclass<_SERVICE>;
  spacePrincipal: Principal;
  userPrincipal: Principal;
  amount: bigint;
}

export const setUserSpaceAllowanceIfNeeded = async ({
  unAuthCkUSD,
  authCkUSDC,
  spacePrincipal,
  amount,
  userPrincipal,
}: SetUserSpaceAllowanceIfNeededArgs) => {
  const { allowance } = await getUserSpaceAllowance({
    unAuthCkUSD,
    spacePrincipal,
    userPrincipal,
  });
  console.log({ allowance, amount });
  if (amount < allowance) {
    return;
  }
  console.log(123123);
  await setUserSpaceAllowance({
    authCkUSDC,
    spacePrincipal,
    amount,
  });

  console.log({
    spacePrincipal: spacePrincipal.toString(),
    userPrincipal: userPrincipal.toString(),
    amount,
  });
};
