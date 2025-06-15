use candid::{CandidType, Principal};
use minicbor::{Decode, Encode};
use serde::Deserialize;

use crate::deposit::{calculate_deposit_amount, deposit_ckusdc};
use crate::errors::Error;
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
}
