use crate::errors::Error;
use std::borrow::Cow;

use crate::tasks::submission::{Submission, SubmissionState};
use crate::tasks::task_types::*;
use crate::tasks::timer_logic::now_in_seconds;
use crate::tasks::token_reward::TokenReward;
use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
pub struct CreateTaskArgs {
    pub task_title: String,
    pub token_reward: TokenReward,
    pub task_content: Vec<TaskContent>,
    pub number_of_uses: u64,
    pub start_time: u64,
    pub end_time: u64,
}

impl CreateTaskArgs {
    pub fn validate(&self) -> Result<(), Error> {
        if self.task_title.trim().len() > 50 {
            return Err(Error::InvalidTaskContent(
                "Task title is too long (max length: 50)".into(),
            ));
        }
        if self.task_content.len() > 10 {
            return Err(Error::InvalidTaskContent("Too many subtasks".into()));
        }
        if self.end_time <= self.start_time {
            return Err(Error::InvalidTaskContent(
                "Task End time must be after start time".into(),
            ));
        }

        let min_task_time = 5 * 60; // 5 minutes
        if (self.start_time + min_task_time) <= now_in_seconds() {
            return Err(Error::InvalidTaskContent(
                "Task start time already passed".into(),
            ));
        }

        if self.end_time <= (self.start_time + min_task_time) {
            return Err(Error::InvalidTaskContent(format!(
                "Task end time must be at least {} minutes in the future",
                min_task_time / 60
            )));
        }
        self.task_content
            .iter()
            .try_for_each(|content| content.validate())
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct Task {
    #[cbor(n(0), with = "shared::cbor::principal")]
    pub(crate) creator: Principal,
    #[n(1)]
    pub(crate) token_reward: TokenReward,
    #[n(2)]
    pub(crate) tasks: Vec<TaskType>,
    #[n(3)]
    pub(crate) number_of_uses: u64,
    #[n(4)]
    pub(crate) task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    pub(crate) rewarded: Vec<Principal>,
    #[n(6)]
    pub(crate) start_time: u64, // in seconds
    #[n(7)]
    pub(crate) end_time: u64, // in seconds
    #[n(8)]
    pub(crate) timer_id: Option<TimerKeyData>,
}

impl Task {
    pub async fn new(
        creator: Principal,
        create_task_args: CreateTaskArgs,
        subaccount: [u8; 32],
        timer_id: TimerKeyData,
    ) -> Result<Self, Error> {
        create_task_args
            .token_reward
            .deposit_reward(creator, subaccount, create_task_args.number_of_uses)
            .await?;

        Ok(Self {
            creator,
            token_reward: create_task_args.token_reward,
            tasks: create_task_args
                .task_content
                .iter()
                .map(|content| content.into())
                .collect(),
            number_of_uses: create_task_args.number_of_uses,
            task_title: create_task_args.task_title,
            rewarded: Vec::new(),
            start_time: create_task_args.start_time,
            end_time: create_task_args.end_time,
            timer_id: Some(timer_id),
        })
    }

    pub fn is_expired(&self) -> bool {
        now_in_seconds() > self.end_time
    }

    pub fn is_active(&self) -> bool {
        now_in_seconds() > self.start_time && !self.is_expired()
    }

    pub fn submit_subtask_submission(
        &mut self,
        user: Principal,
        subtask_id: usize,
        submission: Submission,
    ) -> Result<(), Error> {
        if !self.is_active() {
            return Err(Error::TaskNotActive);
        }

        let subtask = self
            .tasks
            .get_mut(subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;
        subtask.submit(user, submission)?;

        Ok(())
    }

    pub fn accept_subtask_submission(
        &mut self,
        user: Principal,
        subtask_id: usize,
    ) -> Result<(), Error> {
        let subtask = self
            .tasks
            .get_mut(subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;
        subtask.accept(user)?;

        Ok(())
    }

    pub fn reject_subtask_submission(
        &mut self,
        user: Principal,
        subtask_id: usize,
        reason: Option<String>,
    ) -> Result<(), Error> {
        let subtask = self
            .tasks
            .get_mut(subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;
        let reason = reason.and_then(|r| {
            let trimmed = r.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        });
        subtask.reject(user, reason)?;
        Ok(())
    }

    pub async fn claim_reward(
        &mut self,
        user: Principal,
        subaccount: [u8; 32],
    ) -> Result<(), Error> {
        let subtask = self.tasks.iter().all(|task| {
            let state = task.get_submission(user).unwrap().get_state();
            state == &SubmissionState::Accepted
        });
        if !subtask {
            return Err(Error::SubmissionNotAccepted);
        }
        if Nat::from(self.rewarded.len()) >= self.number_of_uses {
            return Err(Error::UsageLimitExceeded);
        }
        if self.rewarded.contains(&user) {
            return Err(Error::UserAlreadyRewarded);
        }
        self.token_reward.withdraw_reward(user, subaccount).await?;
        self.rewarded.push(user);
        Ok(())
    }
}

impl Storable for Task {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("Task encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode Task bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Unbounded;
}
