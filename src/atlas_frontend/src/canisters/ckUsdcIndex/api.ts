import {  type ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
  GetTransactions,
} from "../../../../declarations/ckusdc_index_canister/ckusdc_index_canister.did.js";
import type { Principal } from "@dfinity/principal";
import { unwrapCall } from "../delegatedCall.js";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { appendUserTxs, setCkUsdcBalance } from "../../store/slices/userSlice.js";
import type { UserTransactions } from "./types.js";
import { serify } from "@karmaniverous/serify-deserify";
import { customSerify } from "../../store/store.js";

interface GetUserTransactionsArgs {
  unAuthCkUsdIndexer: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  start: bigint | null;
  maxResults: bigint;
  dispatch: Dispatch<UnknownAction>;
}

export const getUserTransactions = async ({
  unAuthCkUsdIndexer,
  userPrincipal,
  start,
  maxResults,
  dispatch,
}: GetUserTransactionsArgs) => {
  const call = unAuthCkUsdIndexer.get_account_transactions({
    max_results: maxResults,
    start: start ? [start] : [],
    account: {
      owner: userPrincipal,
      subaccount: [],
    },
  });

  const transactions = await unwrapCall<GetTransactions>({
    call,
    errMsg: "Failed to get user transactions",
  });
  dispatch(setCkUsdcBalance(transactions.balance));
  const txs: UserTransactions = transactions.transactions.reduce((acc, val) => {
    return {
      ...acc,
      [val.id.toString()]: val.transaction,
    };
  }, {});
  dispatch(appendUserTxs(serify(txs, customSerify) as UserTransactions));
};

