use candid::{Nat, Principal};
use ic_cdk::call::Call;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::TransferArg;
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
            owner: ic_cdk::api::canister_self(),
            subaccount: Some(subaccount),
        },
        from: Account::from(caller),
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
        spender_subaccount: None,
    };

    Call::bounded_wait(ckusdc_ledger.principal, "icrc2_transfer_from")
        .with_args(&(transfer_args,))
        .await
        .map_err(|err| Error::FailedToTransfer(err.to_string()))?
        .candid::<Result<Nat, TransferFromError>>()
        .map_err(|err| Error::FailedToParse(err.to_string()))?
        .map_err(|err| Error::FailedToTransfer(err.to_string()))?;

    Ok(())
}

pub async fn withdraw_ckusdc(
    caller: Principal,
    subaccount: [u8; 32],
    amount: Nat,
) -> Result<(), Error> {
    let ckusdc_ledger = memory::read_config(|config| config.ckusdc_ledger.clone());

    let transfer_args = TransferArg {
        to: Account::from(caller),
        from_subaccount: Some(subaccount),
        amount,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    Call::bounded_wait(ckusdc_ledger.principal, "icrc1_transfer")
        .with_args(&(transfer_args,))
        .await
        .map_err(|err| Error::FailedToTransfer(err.to_string()))?
        .candid::<Result<Nat, TransferFromError>>()
        .map_err(|err| Error::FailedToParse(err.to_string()))?
        .map_err(|err| Error::FailedToTransfer(err.to_string()))?;

    Ok(())
}

pub async fn get_account_balance(
    account_owner: Principal,
    subaccount: Option<[u8; 32]>,
) -> Result<Nat, Error> {
    let ckusdc_ledger = memory::read_config(|config| config.ckusdc_ledger.clone());
    let account = Account {
        owner: account_owner,
        subaccount,
    };
    Call::bounded_wait(ckusdc_ledger.principal, "icrc1_balance_of")
        .with_args(&(account,))
        .await
        .map_err(|err| Error::FailedToQueryBalance(err.to_string()))?
        .candid::<Nat>()
        .map_err(|err| Error::FailedToParse(err.to_string()))
}
