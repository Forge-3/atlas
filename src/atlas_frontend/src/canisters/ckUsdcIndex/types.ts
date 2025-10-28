import type { Transaction } from "../../../../declarations/ckusdc_ledger_canister/ckusdc_ledger_canister.did";

export interface UserTransactions {
    [key: string]: Transaction
}