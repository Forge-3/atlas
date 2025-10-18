use crate::errors::Error;
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::collections::HashSet;

use crate::tasks::submission::{Submission, SubmissionState};
use crate::tasks::task_types::*;
use crate::tasks::timer_logic::now_in_seconds;
use crate::tasks::token_reward::TokenReward;
use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use sha2::Digest;

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
        validate_task_title(&self.task_title)?;
        validate_task_content(&self.task_content)?;
        validate_task_time_create(self.start_time, self.end_time)?;
        Ok(())
    }
}

#[derive(CandidType, Deserialize)]
pub struct EditTaskArgs {
    pub task_id: TaskId,
    pub task_title: Option<String>,
    pub token_reward: Option<TokenReward>,
    pub task_content: Option<Vec<Option<TaskContent>>>,
    pub number_of_uses: Option<u64>,
    pub start_time: Option<u64>,
    pub end_time: Option<u64>,
}

impl EditTaskArgs {
    pub fn validate(&self) -> Result<(), Error> {
        if let Some(title) = &self.task_title {
            validate_task_title(title)?;
        }

        if let Some(content) = &self.task_content {
            let filtered_content: Vec<TaskContent> =
                content.iter().filter_map(|c| c.clone()).collect();
            validate_task_content(&filtered_content)?;
        }

        if let (Some(start), Some(end)) = (self.start_time, self.end_time) {
            validate_task_time_edit(start, end)?;
        }

        Ok(())
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
    #[cbor(n(9), with = "shared::cbor::principal::b_tree_map")]
    pub(crate) referrals: BTreeMap<Principal, ReferralEntry>, // <invitee → (inviter, reward_claimed: bool)>
    #[n(10)]
    pub(crate) affiliate_uses: u64,
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

        let affiliate_uses = create_task_args
            .token_reward
            .get_affiliate_uses(create_task_args.number_of_uses);

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
            referrals: BTreeMap::new(),
            affiliate_uses,
        })
    }

    pub fn is_expired(&self) -> bool {
        now_in_seconds() > self.end_time
    }

    pub fn is_active(&self) -> bool {
        now_in_seconds() > self.start_time && !self.is_expired()
    }

    pub fn edit_task(&mut self, args: &EditTaskArgs, new_tasks: Option<&Vec<TaskType>>) {
        if let Some(title) = &args.task_title {
            self.task_title = title.clone();
        }

        if let Some(token_reward) = &args.token_reward {
            self.token_reward = token_reward.clone();
        }

        if let Some(start_time) = args.start_time {
            self.start_time = start_time;
        }

        if let Some(end_time) = args.end_time {
            self.end_time = end_time;
        }

        if let Some(number_of_uses) = args.number_of_uses {
            self.number_of_uses = number_of_uses;
        }

        if let Some(new_tasks) = new_tasks {
            self.tasks = new_tasks.clone();
        }
    }

    pub fn is_fully_rewarded(&self) -> bool {
        self.rewarded.len() as u64 == self.number_of_uses
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
        self.tasks.iter().try_for_each(|task| {
            let state = task.get_submission(user)?.get_state();
            if state == &SubmissionState::Accepted {
                Ok(())
            } else {
                Err(Error::SubmissionNotAccepted)
            }
        })?;
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

    pub async fn claim_all_rewards(&mut self, task_id: TaskId) -> Result<(), Error> {
        let tasks = self.tasks.clone();
        let not_rewarded = tasks
            .first()
            .expect("First subtask to not exist?!")
            .get_submission_map()
            .iter()
            .filter(|(principal, _)| !self.rewarded.contains(principal));

        let users_to_rewarded: HashSet<_> = not_rewarded
            .into_iter()
            .filter(|(principal, _)| {
                tasks.iter().all(|task| {
                    task.get_submission(**principal)
                        .map(|sub| sub.get_state() == &SubmissionState::Accepted)
                        .unwrap_or(false)
                })
            })
            .map(|(principal, _)| principal)
            .collect();

        for principal in users_to_rewarded {
            let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
            self.claim_reward(*principal, subaccount).await?;
        }

        Ok(())
    }

    pub fn register_referral(
        &mut self,
        inviter: Principal,
        invitee: Principal,
    ) -> Result<(), Error> {
        if inviter == invitee {
            return Err(Error::InvalidReferral(
                "Inviter and invitee cannot be the same".into(),
            ));
        }

        if self.referrals.contains_key(&invitee) {
            return Err(Error::ReferralAlreadyExists);
        }

        self.referrals.insert(
            invitee,
            ReferralEntry {
                inviter,
                reward_claimed: false,
            },
        );

        Ok(())
    }

    pub async fn claim_affiliate_reward(
        &mut self,
        user: Principal,
        subaccount: [u8; 32],
    ) -> Result<(), Error> {
        let referral_entry = self
            .referrals
            .get(&user)
            .ok_or(Error::InvalidReferral("User is not an invitee".into()))?;

        if referral_entry.reward_claimed {
            return Err(Error::UserAlreadyRewarded);
        }

        let claimed_count = self
            .referrals
            .values()
            .filter(|entry| entry.reward_claimed)
            .count() as u64;

        if claimed_count >= self.affiliate_uses {
            return Err(Error::UsageLimitExceeded);
        }

        let inviter = referral_entry.inviter;
        self.token_reward
            .withdraw_affiliate_reward(inviter, subaccount)
            .await?;

        self.referrals
            .get_mut(&user)
            .expect("User has to exist at this point")
            .reward_claimed = true;

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

// validation functions for task creation

pub const MAX_TASK_TITLE_LENGTH: usize = 50;
pub const MIN_TASK_TIME: u64 = 5 * 60;
pub const MAX_NUMBER_OF_SUBTASKS: usize = 10;

pub fn validate_task_title(title: &str) -> Result<(), Error> {
    if title.trim().len() > MAX_TASK_TITLE_LENGTH {
        return Err(Error::InvalidTaskContent(format!(
            "Task title is too long (max length: {MAX_TASK_TITLE_LENGTH})",
        )));
    }

    Ok(())
}

pub fn validate_task_content(task_content: &[TaskContent]) -> Result<(), Error> {
    if task_content.len() > MAX_NUMBER_OF_SUBTASKS {
        return Err(Error::InvalidTaskContent("Too many subtasks".into()));
    }
    if task_content.is_empty() {
        return Err(Error::InvalidTaskContent(
            "Too few subtasks (must be at least 1)".into(),
        ));
    }

    task_content.iter().try_for_each(|c| c.validate())
}

pub fn validate_task_time_create(start: u64, end: u64) -> Result<(), Error> {
    if (start + MIN_TASK_TIME) <= now_in_seconds() {
        return Err(Error::InvalidTaskContent(
            "Task start time already passed".into(),
        ));
    }

    if end <= (start + MIN_TASK_TIME) {
        return Err(Error::InvalidTaskContent(format!(
            "Task end time must be at least {} minutes in the future",
            MIN_TASK_TIME / 60
        )));
    }

    Ok(())
}

pub fn validate_task_time_edit(start: u64, end: u64) -> Result<(), Error> {
    if end <= start {
        return Err(Error::InvalidTaskContent(
            "Task end time must be after start time".to_string(),
        ));
    }

    if end <= now_in_seconds() {
        return Err(Error::InvalidTaskContent(
            "Task end time must be in the future".to_string(),
        ));
    }

    Ok(())
}
