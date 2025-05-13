use candid::CandidType;
use ic_ledger_types::Tokens;
use minicbor::{Decode, Encode};
use serde::Deserialize;

use crate::nat256::Nat256;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, Deserialize, CandidType)]
pub enum TokenReward {
    #[n(0)]
    ICP{
        #[cbor(n(0), with = "shared::cbor::tokens")]
        amount: Tokens
    },
    #[n(1)]
    CkUsdc {
        #[n(0)]
        amount: Nat256
    }
}