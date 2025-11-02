use crate::errors::Error;
use crate::memory;
use crate::tasks::token_reward::{PERCENTAGE_FOR_AFFILIATION_REWARDS, SINGLE_AFFILIATION_REWARD};
use candid::{Nat, Principal};
use ic_cdk::call::Call;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::TransferArg;
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use std::cmp::min;

pub fn calculate_deposit_amount(reward: Nat, fee: Option<Nat>, number_of_uses: u64) -> Nat {
    let base_reward = number_of_uses * reward.clone();

    let affiliate_uses = calculate_affiliate_uses(reward, number_of_uses);
    let affiliate_adjusted = affiliate_uses * Nat::from(SINGLE_AFFILIATION_REWARD);

    let expected_fee = if let Some(fee) = fee {
        number_of_uses * fee.clone() + affiliate_uses * fee
    } else {
        0u8.into()
    };

    base_reward + affiliate_adjusted + expected_fee
}

pub fn calculate_affiliate_uses(reward: Nat, number_of_uses: u64) -> u64 {
    let base_reward = number_of_uses * reward;
    let affiliate_base =
        (base_reward.clone() * PERCENTAGE_FOR_AFFILIATION_REWARDS) / Nat::from(100u64);
    let affiliate_uses_nat = affiliate_base.clone() / Nat::from(SINGLE_AFFILIATION_REWARD);
    let digits = affiliate_uses_nat.0.to_u64_digits();
    let affiliate_uses = digits.first().copied().unwrap_or(0);
    if digits.len() > 1 {
        panic!("affiliate_uses does not fit in u64");
    }
    min(number_of_uses, affiliate_uses)
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
