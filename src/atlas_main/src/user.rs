use std::{borrow::Cow, fmt};

use crate::errors::Error;
use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use std::cmp::min;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, CandidType, Clone)]
pub struct Integrations {
    #[n(0)]
    discord_id: Option<String>,
}

impl Storable for Integrations {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("Integrations encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
            panic!(
                "failed to decode Integrations bytes {}: {e}",
                hex::encode(bytes)
            )
        })
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

const MAX_REFERRALS_PER_TASK: u16 = 5;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, CandidType, Clone)]
pub enum ChampionLevel {
    #[default]
    #[n(0)]
    Level1,
    #[n(1)]
    Level2,
    #[n(2)]
    Level3,
    #[n(3)]
    Level4,
    #[n(4)]
    Level5,
}

impl ChampionLevel {
    pub fn from_points(points: u64) -> Self {
        match points {
            0..=99 => ChampionLevel::Level1,
            100..=499 => ChampionLevel::Level2,
            500..=699 => ChampionLevel::Level3,
            700..=999 => ChampionLevel::Level4,
            _ => ChampionLevel::Level5,
        }
    }

    pub fn global_invite_cap(&self) -> u16 {
        match self {
            ChampionLevel::Level1 => 0,
            ChampionLevel::Level2 => 5,
            ChampionLevel::Level3 => 7,
            ChampionLevel::Level4 => 10,
            ChampionLevel::Level5 => 15,
        }
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, CandidType, Clone)]
pub struct ReferralReward {
    //what should be stored? might as well store just space_principal, time or task_title
    #[n(0)]
    pub space_id: u64,
    #[n(1)]
    pub task_id: u64,
    #[cbor(n(2), with = "shared::cbor::principal")]
    pub invitee: Principal,
    #[n(3)]
    pub points: u64,
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

    // Affiliation
    #[n(5)]
    pub(crate) deci_xp_points: u64, // stored as deciXP (XP * 10), e.g. 15 = 1.5 XP
    #[n(6)]
    pub(crate) referral_rewards: Vec<ReferralReward>,
}

impl User {
    pub fn new(rank: Rank) -> Self {
        Self {
            integrations: Integrations::default(),
            rank,
            owned_spaces: Vec::new(),
            space_creation_in_progress: false,
            belonging_to_spaces: Vec::new(),
            deci_xp_points: 0u64,
            referral_rewards: Vec::new(),
        }
    }

    pub fn belonging_to_spaces(&self) -> &Vec<u64> {
        &self.belonging_to_spaces
    }

    pub fn join_space(&mut self, space_id: u64) {
        self.belonging_to_spaces.push(space_id);
    }

    pub fn leave_space(&mut self, position: usize) {
        self.belonging_to_spaces.remove(position);
        self.deci_xp_points = 0;
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
                expected: Rank::User,
                found: self.rank().clone(),
            }),
            Rank::SuperAdmin => Err(Error::UserRankToHigh {
                expected: Rank::User,
                found: self.rank().clone(),
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
                expected: Rank::User,
                found: self.rank().clone(),
            }),
            Rank::SpaceLead => Err(Error::UserAlreadyHaveExpectedRank(Rank::SpaceLead)),
            Rank::SuperAdmin => Err(Error::UserRankToHigh {
                expected: Rank::User,
                found: self.rank().clone(),
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

    pub fn champion_level(&self) -> ChampionLevel {
        ChampionLevel::from_points(self.deci_xp_points)
    }

    pub fn add_xp(&mut self, reward_e8s: u64) {
        // minimum 0.1 USDC
        let xp_to_add = reward_e8s / 100_000;
        self.deci_xp_points += xp_to_add;
    }

    pub fn register_referral_reward(
        &mut self,
        space_index: u64,
        task_id: u64,
        invitee: Principal,
        reward_e8s: u64,
    ) {
        let points = reward_e8s / 100_000;
        self.referral_rewards.push(ReferralReward {
            space_id: space_index,
            task_id,
            invitee,
            points,
        });

        self.add_xp(reward_e8s);
    }

    pub fn remaining_referral_rewards_for_task(&self, space_id: u64, task_id: u64) -> u16 {
        let claimed_for_task = self
            .referral_rewards
            .iter()
            .filter(|r| r.space_id == space_id && r.task_id == task_id)
            .count() as u16;

        let claimed_total = self.referral_rewards.len() as u16;
        let global_cap = self.champion_level().global_invite_cap();
        let task_limit = MAX_REFERRALS_PER_TASK;

        let remaining_task_limit = task_limit.saturating_sub(claimed_for_task);
        let remaining_global_limit = global_cap.saturating_sub(claimed_total);

        min(remaining_task_limit, remaining_global_limit)
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
