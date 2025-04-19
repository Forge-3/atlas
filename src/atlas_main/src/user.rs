use std::{borrow::Cow, fmt};

use crate::errors::Error;
use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default)]
pub struct Integrations {
    #[n(0)]
    discord_id: Option<String>,
}

impl Storable for Integrations {
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

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, Deserialize, Clone, CandidType)]
pub enum Rank {
    #[default]
    #[n(0)]
    User,
    #[n(1)]
    SpaceLead,
    #[n(2)]
    Admin,
}

impl fmt::Display for Rank {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_string())
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default)]
pub struct User {
    #[n(0)]
    integrations: Integrations,
    #[n(1)]
    rank: Rank,
    #[n(2)]
    owned_spaces: Vec<u32>,
}

impl User {
    pub fn new(rank: Rank) -> Self {
        Self {
            integrations: Integrations::default(),
            rank,
            owned_spaces: Vec::new(),
        }
    }

    pub fn rank(&self) -> &Rank {
        &self.rank
    }

    pub fn promote_to_space_lead(&mut self) -> Result<(), Error> {
        match self.rank() {
            Rank::User => {
                self.rank = Rank::SpaceLead;
                Ok(())
            }
            Rank::Admin => Err(Error::UserRankToHigh {
                expected: self.rank().clone(),
                found: Rank::User,
            }),
            Rank::SpaceLead => Err(Error::UserAlreadyHaveExpectedRank(Rank::SpaceLead)),
        }
    }

    pub fn owned_spaces_count(&self) -> usize {
        self.owned_spaces.len()
    }
}

impl Storable for User {
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
