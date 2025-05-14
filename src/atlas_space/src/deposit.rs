use candid::{Nat, Principal};
use ic_ledger_types::BlockIndex;
use icrc_ledger_types::icrc1::account::Account as AccountIcrc;
use icrc_ledger_types::icrc2::transfer_from::{
    TransferFromArgs as TransferFromArgsIcrc, TransferFromError as TransferFromErrorIcrc,
};

use crate::errors::Error;
use crate::memory;

pub fn calculate_deposit_amount(deposit: Nat, fee: Option<Nat>, number_of_uses: u64) -> Nat {
    if let Some(fee) = fee {
        let min_fee = number_of_uses * fee;
        deposit + min_fee
    } else {
        deposit
    }
}

pub async fn deposit_ckusdc(caller: Principal, subaccount: [u8; 32], amount: Nat) -> Result<(), Error> {
    let ckusdc_ledger = memory::read_config(|config| 
        config.ckusdc_ledger.clone()
    );

    let transfer_args = TransferFromArgsIcrc {
        from: AccountIcrc {
            owner: caller,
            subaccount: None,
        },
        to: AccountIcrc {
            owner: ic_cdk::api::id(),
            subaccount: Some(subaccount),
        },
        amount: amount,
        fee: ckusdc_ledger.fee,
        memo: None,
        created_at_time: None,
        spender_subaccount: None,
    };

    ic_cdk::call::<(TransferFromArgsIcrc,), (Result<BlockIndex, TransferFromErrorIcrc>,)>(
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
