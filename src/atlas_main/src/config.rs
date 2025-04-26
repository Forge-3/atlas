use std::borrow::Cow;

use candid::CandidType;
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, Deserialize, CandidType, Clone, Copy)]
pub struct Config {
    #[n(0)]
    spaces_per_space_lead: u8
}

impl Config {
    pub fn new(spaces_per_space_lead: u8) -> Self {
        Self {
            spaces_per_space_lead
        }
    }

    pub fn spaces_per_space_lead(&self) -> u8 {
        self.spaces_per_space_lead
    }
}

impl Storable for Config {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("User encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode User bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Unbounded;
}