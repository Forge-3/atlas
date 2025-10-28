use candid::{CandidType, Nat, Principal};
use minicbor::{Decode, Encode};
use serde::Deserialize;

use crate::errors::Error;
use crate::funds::{
    calculate_deposit_amount, deposit_ckusdc, get_account_balance, withdraw_ckusdc,
};
use crate::memory;
use crate::nat256::Nat256;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, Deserialize, CandidType)]
pub enum TokenReward {
    #[n(1)]
    CkUsdc {
        #[n(0)]
        amount: Nat256,
    },
}

impl TokenReward {
    pub fn amount(&self) -> &Nat256 {
        match self {
            TokenReward::CkUsdc { amount } => amount,
        }
    }

    pub async fn deposit_reward(
        &self,
        caller: Principal,
        subaccount: [u8; 32],
        number_of_uses: u64,
    ) -> Result<(), Error> {
        let ckusdc_ledger = memory::read_config(|config| config.ckusdc_ledger.clone());

        match self {
            TokenReward::CkUsdc { amount } => {
                let deposit_and_fee = calculate_deposit_amount(
                    amount.as_ref().clone(),
                    ckusdc_ledger.fee,
                    number_of_uses,
                );
                deposit_ckusdc(caller, subaccount, deposit_and_fee.clone()).await?;
                ic_cdk::println!(
                    "Transfered {deposit_and_fee} ckUSDC to subaccount: {}",
                    hex::encode(subaccount)
                );
                Ok(())
            }
        }
    }

    pub async fn withdraw_reward(
        &self,
        caller: Principal,
        subaccount: [u8; 32],
    ) -> Result<(), Error> {
        match self {
            TokenReward::CkUsdc { amount } => {
                withdraw_ckusdc(caller, subaccount, amount.as_ref().clone()).await?;
                ic_cdk::println!("Transfered {amount} ckUSDC to user: {caller}",);
                Ok(())
            }
        }
    }

    pub async fn withdraw_remains(
        &self,
        creator: Principal,
        subaccount: [u8; 32],
        unused_count: u64,
    ) -> Result<(), Error> {
        match self {
            TokenReward::CkUsdc { amount } => {
                let refund_amount = amount.as_ref().clone() * Nat::from(unused_count);
                withdraw_ckusdc(creator, subaccount, refund_amount.clone()).await?;
                ic_cdk::println!(
                    "Refunded {refund_amount} ckUSDC unused rewards to creator: {creator}"
                );
                Ok(())
            }
        }
    }

    pub async fn adjust_reward(
        &self,
        creator: Principal,
        subaccount: [u8; 32],
        current_token_reward: TokenReward,
        current_number_of_uses: u64,
        new_number_of_uses: u64,
        number_of_rewarded: u64,
    ) -> Result<(), Error> {
        let ckusdc_ledger = memory::read_config(|config| config.ckusdc_ledger.clone());
        match self {
            TokenReward::CkUsdc { amount } => {
                self.check_balance_consistency(
                    subaccount,
                    &current_token_reward,
                    current_number_of_uses,
                    number_of_rewarded,
                )
                .await?;

                let current_total = calculate_deposit_amount(
                    current_token_reward.amount().as_ref().clone(),
                    ckusdc_ledger.fee.clone(),
                    current_number_of_uses,
                );
                let new_total = calculate_deposit_amount(
                    amount.as_ref().clone(),
                    ckusdc_ledger.fee.clone(),
                    new_number_of_uses,
                );
                if current_total < new_total {
                    let total_deposit: Nat = new_total.clone() - current_total.clone();
                    deposit_ckusdc(creator, subaccount, total_deposit.clone()).await?;
                    ic_cdk::println!(
                        "Transfered {total_deposit} ckUSDC to subaccount: {}",
                        hex::encode(subaccount)
                    );
                }
                if current_total > new_total.clone() {
                    let mut total_withdraw: Nat = current_total.clone() - new_total.clone();
                    let fee = ckusdc_ledger.fee.unwrap_or(Nat::from(0u32));
                    ic_cdk::println!("fee: {fee}");
                    if total_withdraw <= fee {
                        ic_cdk::println!("Refund skipped — difference ({total_withdraw}) is not greater than fee ({fee})");
                        return Ok(());
                    }
                    total_withdraw -= fee;
                    withdraw_ckusdc(creator, subaccount, total_withdraw.clone()).await?;
                    ic_cdk::println!("Refunded {total_withdraw} ckUSDC to creator: {creator}");
                }

                Ok(())
            }
        }
    }

    pub async fn check_balance_consistency(
        &self,
        subaccount: [u8; 32],
        current_token_reward: &TokenReward,
        current_number_of_uses: u64,
        number_of_rewarded: u64,
    ) -> Result<(), Error> {
        let ckusdc_ledger = memory::read_config(|config| config.ckusdc_ledger.clone());

        let real_balance =
            get_account_balance(ic_cdk::api::canister_self(), Some(subaccount)).await?;
        let expected_spent = calculate_deposit_amount(
            current_token_reward.amount().as_ref().clone(),
            ckusdc_ledger.fee.clone(),
            number_of_rewarded,
        );

        let current_total = calculate_deposit_amount(
            current_token_reward.amount().as_ref().clone(),
            ckusdc_ledger.fee.clone(),
            current_number_of_uses,
        );

        if current_total < expected_spent {
            return Err(Error::BalanceInconsistency(
                "Spent more than expected".to_string(),
            ));
        }

        let expected_balance = current_total.clone() - expected_spent.clone();
        if expected_balance != real_balance {
            return Err(Error::BalanceInconsistency(format!("Real balance {real_balance} is inconsistent with expected balance {expected_balance}")));
        }

        Ok(())
    }
}
