use candid::CandidType;
use minicbor::{Decode, Encode};
use serde::Deserialize;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, Deserialize, CandidType)]
pub struct XpReward {
    #[n(0)]
    xp_amount: u64,
}
