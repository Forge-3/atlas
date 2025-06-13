use std::{borrow::Cow, collections::BTreeMap, fmt};

use candid::{CandidType, Nat, Principal};
use ic_cdk::update;
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use sha2::Digest;
use submission::{Submission, SubmissionData, SubmissionState};
use token_reward::TokenReward;

use crate::{errors::Error, methods::update::validate_discord_invite_link};

pub mod submission;
pub mod token_reward;
pub mod xp_reward;

#[derive(CandidType, Deserialize)]
pub struct CreateTaskArgs {
    pub task_title: String,
    pub token_reward: TokenReward,
    pub task_content: Vec<(CreateTaskType,TaskContent)>,
    pub number_of_uses: u64,
}

impl CreateTaskArgs {
    pub fn validate(&self) -> Result<(), Error> {
        self.task_content.iter().try_for_each(|(_, task_content)| 
            task_content.validate()
        )
    }
}

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

impl TaskContent {
    pub fn validate(&self) -> Result<(), Error> {
        match self {
            TaskContent::TitleAndDescription {
                task_title,
                task_description,
            } => {
                if task_title.trim().len() > 50 {
                    return Err(Error::InvalidTaskContent(
                        "Subtask title is too long (max length: 50)".into(),
                    ));
                }
                if task_description.trim().len() > 500 {
                    return Err(Error::InvalidTaskContent(
                        "Subtask description is too long (max length: 500)".into(),
                    ));
                }
                Ok(())
            }
        }
    }
}

#[derive(CandidType, Deserialize)]
pub enum CreateTaskType {
    GenericTask,
    DiscordTask
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub enum TaskType {
    #[n(0)]
    GenericTask {
        #[n(0)]
        task_content: TaskContent,
        #[cbor(n(1), with = "shared::cbor::principal::b_tree_map")]
        submission: BTreeMap<Principal, SubmissionData>,
    },
    #[n(1)]
    DiscordTask {
        #[n(0)]
        task_content: TaskContent,
        #[cbor(n(1), with = "shared::cbor::principal::b_tree_map")]
        submission: BTreeMap<Principal, SubmissionData>,
        #[n(2)]
        guild_id: String,
        #[n(3)]
        discord_invite_link: String,
        #[n(4)]
        guild_icon: Option<String>,
        #[n(5)]
        expires_at: Option<String>, 
    }
}

impl TaskType {
    pub fn submit(&mut self, user: Principal, submission_data: Submission) -> Result<(), Error> {
        if self.get_submission_by_user(&user).is_some() {
            return Err(Error::UserAlreadySubmitted);
        }

        match self {
            TaskType::GenericTask { submission, .. } => {
                if !submission_data.is_text() {
                    return Err(Error::IncorrectSubmission("Expected text submission".to_string()));
                }
                submission.insert(user, SubmissionData::new(submission_data, SubmissionState::WaitingForReview));
                Ok(())
            }
            TaskType::DiscordTask { submission: current_submission, .. } => {
                let Submission::Discord { access_token, guild_id } = submission_data else {
                    return Err(Error::IncorrectSubmission("Expected Discord submission".to_string()));
                };
                current_submission.insert(user, SubmissionData::new(Submission::Discord { access_token, guild_id }, SubmissionState::WaitingForReview)); 
                Ok(())
            }
        }
    }
    pub fn accept(&mut self, user: Principal) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                        task_content: _,
                        submission: submissions_map,
                    } => {
                        let submission = submissions_map
                            .get_mut(&user)
                            .ok_or(Error::UserSubmissionNotFound)?;
                        submission.set_state(SubmissionState::Accepted);
                    }
            TaskType::DiscordTask { task_content, submission, guild_id, discord_invite_link, guild_icon, expires_at } => todo!(),
        }

        Ok(())
    }
    pub fn reject(&mut self, user: Principal) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                        task_content: _,
                        submission: submissions_map,
                    } => {
                        let submission = submissions_map
                            .get_mut(&user)
                            .ok_or(Error::UserSubmissionNotFound)?;
                        submission.set_state(SubmissionState::Rejected);
                    }
            TaskType::DiscordTask { task_content, submission, guild_id, discord_invite_link, guild_icon, expires_at } => todo!(),
        }

        Ok(())
    }

    pub fn get_submission(&self, user: Principal) -> Result<&SubmissionData, Error> {
        match self {
            TaskType::GenericTask {
                        task_content: _,
                        submission: submissions_map,
                    } => Ok(submissions_map
                        .get(&user)
                        .ok_or(Error::UserSubmissionNotFound)?),
            TaskType::DiscordTask { task_content, submission, guild_id, discord_invite_link, guild_icon, expires_at } => todo!(),
                    }
            }

    pub fn get_submission_by_user(&self, user: &Principal) -> Option<&SubmissionData> {
        match self {
            TaskType::GenericTask { submission, .. } => submission.get(user),
            TaskType::DiscordTask { submission, .. } => submission.get(user),
        }
    }
}


#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct Task {
    #[cbor(n(0), with = "shared::cbor::principal")]
    creator: Principal,
    #[n(1)]
    token_reward: TokenReward,
    #[n(2)]
    pub tasks: Vec<TaskType>,
    #[n(3)]
    number_of_uses: u64,
     #[n(4)]
    task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    rewarded: Vec<Principal>,
     #[n(6)]
    created_at: u64,
}

impl Task {
    pub async fn new(
        creator: Principal,
        args: CreateTaskArgs,
        subaccount: [u8; 32],
    ) -> Result<Self, Error> {
        args
            .token_reward
            .deposit_reward(creator, subaccount, args.number_of_uses)
            .await?;

        Ok(Self {
            creator,
            token_reward: args.token_reward,
            tasks: args
                .task_content
                .iter()
                .map(|(task_type, task_content)| match task_type {
                    CreateTaskType::GenericTask => {
                            TaskType::GenericTask {
                                task_content: task_content.clone(),
                                submission: BTreeMap::new(),
                            }
                    }
                    CreateTaskType::DiscordTask => {
                            TaskType::DiscordTask {
                                task_content: task_content.clone(),
                                submission: BTreeMap::new(),
                                guild_id:todo!(), 
                                discord_invite_link:todo!(),
                                guild_icon:todo!(),
                                expires_at:todo!(),
                            }
                    }
                })
                .collect(),
            number_of_uses: args.number_of_uses,
            task_title: args.task_title,
            rewarded: Vec::new(),
            created_at: ic_cdk::api::time(),
        })
    }

    pub fn submit_subtask_submission(
        &mut self,
        user: Principal,
        subtask_id: usize,
        submission: Submission,
    ) -> Result<(), Error> {
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
    ) -> Result<(), Error> {
        let subtask = self
            .tasks
            .get_mut(subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;
        subtask.reject(user)?;

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
        minicbor::encode(self, &mut buf).expect("User encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode User bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(
    Eq, PartialEq, Debug, Decode, Encode, Clone, PartialOrd, Ord, CandidType, Deserialize, Copy,
)]
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
