use std::borrow::Cow;

use candid::{CandidType, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use shared::InitArg;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Deserialize, CandidType, Clone)]
pub struct Config {
    #[cbor(n(0), with = "crate::cbor::principal")]
    owner: Principal,
    #[cbor(n(1), with = "crate::cbor::principal")]
    admin: Principal
}
 
impl Config {
    pub fn new(owner: Principal, init_args: InitArg) -> Self {
        Self {
            owner,
            admin: init_args.admin
        }
    }

    pub fn owner(&self) -> Principal {
        self.owner
    }

    pub fn admin(&self) -> Principal {
        self.admin
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