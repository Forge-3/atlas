use std::borrow::Cow;

use candid::CandidType;
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use shared::InitArg;


#[derive(Eq, PartialEq, Debug, Decode, Encode, Deserialize, CandidType, Default, Clone)]
pub struct State {
    #[n(0)]
    space_name: String,
    #[n(1)]
    space_description: String,
    #[n(2)]
    space_logo: Option<String>,
    #[n(3)]
    space_background: Option<String>,
}

impl State {
    pub fn set_space_name(&self, space_name: String) -> Self {
        Self {
            space_name,
            ..self.clone()
        }
    }

    pub fn set_space_description(&self, space_description: String) -> Self {
        Self {
            space_description,
            ..self.clone()
        }
    }

    pub fn set_space_logo(&self, space_logo: String) -> Self {
        Self {
            space_logo: Some(space_logo),
            ..self.clone()
        }
    }

    pub fn set_space_background(&self, space_background: String) -> Self {
        Self {
            space_background: Some(space_background),
            ..self.clone()
        }
    }
}

impl From<InitArg> for State {
    fn from(init_args: InitArg) -> Self {
        Self { 
            space_name: init_args.space_name,
            space_description: init_args.space_description,
            space_logo: init_args.space_logo,
            space_background: init_args.space_background
         }
    }
}

impl Storable for State {
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