use std::{borrow::Cow, clone, fmt};

use crate::errors::Error;
use candid::{CandidType, Deserialize};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, CandidType, Clone)]
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
    #[n(3)]
    SuperAdmin,
}

impl fmt::Display for Rank {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Rank::User => write!(f, "User"),
            Rank::SpaceLead => write!(f, "SpaceLead"),
            Rank::Admin => write!(f, "Admin"),
            Rank::SuperAdmin => write!(f, "SuperAdmin"),
        }
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, CandidType, Clone)]
pub struct User {
    #[n(0)]
    pub(crate) integrations: Integrations,
    #[n(1)]
    pub(crate) rank: Rank,
    #[n(2)]
    pub(crate) owned_spaces: Vec<u64>,
    #[n(3)]
    pub(crate) space_creation_in_progress: bool,
    #[n(4)]
    pub(crate) belonging_to_spaces: Vec<u64>,
}

impl User {
    pub fn new(rank: Rank) -> Self {
        Self {
            integrations: Integrations::default(),
            rank,
            owned_spaces: Vec::new(),
            space_creation_in_progress: false,
            belonging_to_spaces: Vec::new(),
        }
    }

    pub fn belonging_to_spaces(&self) -> &Vec<u64> {
        &self.belonging_to_spaces
    }

    pub fn join_space(&mut self, space_id: u64) {
        self.belonging_to_spaces.push(space_id);
    }

    pub fn rank(&self) -> &Rank {
        &self.rank
    }

    pub fn owned_spaces(&self) -> &Vec<u64> {
        &self.owned_spaces
    }

    pub fn promote_to_admin(&mut self) -> Result<(), Error> {
        match self.rank() {
            Rank::User => {
                self.rank = Rank::Admin;
                Ok(())
            }
            Rank::Admin => Err(Error::UserAlreadyHaveExpectedRank(Rank::Admin)),
            Rank::SpaceLead => Err(Error::UserRankToHigh {
                expected: self.rank().clone(),
                found: Rank::User,
            }),
            Rank::SuperAdmin => Err(Error::UserRankToHigh {
                expected: self.rank().clone(),
                found: Rank::User,
            }),
        }
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
            Rank::SuperAdmin => Err(Error::UserRankToHigh {
                expected: self.rank().clone(),
                found: Rank::User,
            }),
        }
    }

    pub fn owned_spaces_count(&self) -> usize {
        self.owned_spaces.len()
    }

    pub fn push_space(&mut self, space_index: u64) {
        self.owned_spaces.push(space_index);
    }

    pub fn set_space_creation(&mut self, status: bool) {
        self.space_creation_in_progress = status
    }

    pub fn space_creation_in_progress(&self) -> bool {
        self.space_creation_in_progress
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
