use std::{borrow::Cow, collections::BTreeMap, fmt};

use candid::{CandidType, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use token_reward::TokenReward;
use xp_reward::XpReward;

use crate::{
    deposit::calculate_deposit_amount, errors::Error, memory, methods::update::CreateTaskArgs,
};

pub mod token_reward;
pub mod xp_reward;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType, Deserialize)]
pub enum TaskContent {
    #[n(0)]
    TitleAndDescription {
        #[n(0)]
        task_title: String,
        #[n(1)]
        task_description: String,
    },
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone)]
pub enum SubmissionType {
    #[n(0)]
    Text,
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone)]
pub enum TaskType {
    #[n(0)]
    GenericTask {
        #[n(0)]
        task_content: TaskContent,
        #[cbor(n(1), with = "shared::cbor::principal_map")]
        submission: BTreeMap<Principal, String>,
    },
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone)]
pub struct Task {
    #[cbor(n(0), with = "shared::cbor::principal")]
    creator: Principal,
    #[n(1)]
    token_reward: TokenReward,
    #[n(2)]
    task_content: TaskContent,
    #[n(3)]
    number_of_uses: u64,
}

impl Task {
    pub async fn new(
        creator: Principal,
        create_task_args: CreateTaskArgs,
        subaccount: [u8; 32],
    ) -> Result<Self, Error> {
        let token_reward = create_task_args.token_reward.clone();
        token_reward
            .deposit_reward(creator, subaccount, create_task_args.number_of_uses)
            .await?;

        Ok(Self {
            creator,
            token_reward: create_task_args.token_reward,
            task_content: create_task_args.task_content,
            number_of_uses: create_task_args.number_of_uses,
        })
    }
}

impl Storable for Task {
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

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, PartialOrd, Ord, CandidType, Deserialize)]
pub struct TaskId(#[n(0)] u64);

impl fmt::Display for TaskId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "TaskId: {}", self.0)
    }
}

impl TaskId {
    pub fn new(id: u64) -> Self {
        Self(id)
    }

    pub fn u64(&self) -> u64 {
        self.0
    }
}

impl Storable for TaskId {
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
