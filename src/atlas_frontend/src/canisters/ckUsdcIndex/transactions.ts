import type { Transaction } from "../../../../declarations/ckusdc_ledger_canister/ckusdc_ledger_canister.did";

export const formatTransactions = (txObject: Record<string, Transaction>) => {
  return Object.entries(txObject).map(([id, tx]) => {
    const kind = tx.kind;
    const timestamp = tx.timestamp.toString();

    let amount = "0";
    let from = "N/A";
    let to = "N/A";

    if (tx.transfer?.[0]) {
      amount = tx.transfer[0].amount.toString();
      from = tx.transfer[0].from.owner.toText();
      to = tx.transfer[0].to.owner.toText();
    } else if (tx.approve?.[0]) {
      amount = tx.approve[0].amount.toString();
      from = tx.approve[0].from.owner.toText();
      to = tx.approve[0].spender.owner.toText();
    } else if (tx.mint?.[0]) {
      amount = tx.mint[0].amount.toString();
      to = tx.mint[0].to.owner.toText();
    } else if (tx.burn?.[0]) {
      amount = tx.burn[0].amount.toString();
      from = tx.burn[0].from.owner.toText();
    }

    return {
      id,
      kind,
      amount,
      from,
      to,
      timestamp,
    };
  });
}