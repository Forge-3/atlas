use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};

use crate::errors::Error;
use crate::memory;

pub fn calculate_deposit_amount(reward: Nat, fee: Option<Nat>, number_of_uses: u64) -> Nat {
    let expected_deposit = number_of_uses * reward;
    let expected_fee = if let Some(fee) = fee {
        number_of_uses * fee
    } else {
        0u8.into()
    };
    expected_deposit + expected_fee
}

pub async fn deposit_ckusdc(
    caller: Principal,
    subaccount: [u8; 32],
    amount: Nat,
) -> Result<(), Error> {
    let ckusdc_ledger = memory::read_config(|config| config.ckusdc_ledger.clone());

    let transfer_args = TransferFromArgs {
        to: Account {
            owner: ic_cdk::api::id(),
            subaccount: Some(subaccount),
        },
        from: Account::from(caller),
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
        spender_subaccount: None,
    };

    ic_cdk::call::<(TransferFromArgs,), (Result<Nat, TransferFromError>,)>(
        ckusdc_ledger.principal,
        "icrc2_transfer_from",
        (transfer_args,),
    )
    .await
    .map_err(|err| Error::FailedToTransfer(format!("Failed to call ledger: {:?}", err)))?
    .0
    .map_err(|err| Error::FailedToTransfer(format!("Ledger transfer error {:?}", err)))?;

    Ok(())
}
