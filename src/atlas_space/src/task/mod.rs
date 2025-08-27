use std::{borrow::Cow, collections::BTreeMap, fmt};

use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use submission::{Submission, SubmissionData, SubmissionState};
use token_reward::TokenReward;

use crate::errors::Error;

pub mod submission;
pub mod token_reward;
pub mod xp_reward;

#[derive(Debug, serde::Deserialize, serde::Serialize, candid::CandidType, Clone)]
pub struct DiscordGuild {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct DiscordGuildInfo {
    pub id: String,
    pub name: String,
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct DiscordInviteApiResponse {
    pub guild: Option<DiscordGuildInfo>,
    pub expires_at: Option<String>,
}

#[derive(CandidType, Deserialize)]
pub struct CreateTaskArgs {
    pub task_title: String,
    pub token_reward: TokenReward,
    pub task_content: Vec<TaskContent>,
    pub number_of_uses: u64,
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
        self.task_content
            .iter()
            .try_for_each(|task_content| task_content.validate())
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
        #[n(2)]
        allow_resubmit: bool,
    },
    #[n(1)]
    DiscordTask {
        #[n(0)]
        task_title: String,
        #[n(1)]
        task_description: String,
        #[n(2)]
        guild_id: String,
        #[n(3)]
        invite_link: String,
        #[n(4)]
        allow_resubmit: bool,
    },
}

impl TaskContent {
    pub fn validate(&self) -> Result<(), Error> {
        match self {
            TaskContent::TitleAndDescription {
                task_title,
                task_description,
                allow_resubmit: _,
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
            TaskContent::DiscordTask {
                task_title,
                task_description,
                guild_id,
                invite_link,
                allow_resubmit: _,
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
                if guild_id.trim().is_empty() {
                    return Err(Error::InvalidTaskContent("Guild ID cannot be empty".into()));
                }
                if invite_link.trim().is_empty() {
                    return Err(Error::InvalidTaskContent(
                        "Discord invite link cannot be empty".into(),
                    ));
                }
                Ok(())
            }
        }
    }

    pub fn allow_resubmit(&self) -> bool {
        match self {
            TaskContent::TitleAndDescription { allow_resubmit, .. } => *allow_resubmit,
            TaskContent::DiscordTask { allow_resubmit, .. } => *allow_resubmit,
        }
    }
}

impl From<&TaskContent> for TaskType {
    fn from(content: &TaskContent) -> Self {
        match content {
            TaskContent::TitleAndDescription {
                task_title,
                task_description,
                allow_resubmit,
            } => Self::GenericTask {
                task_content: TaskContent::TitleAndDescription {
                    task_title: task_title.clone(),
                    task_description: task_description.clone(),
                    allow_resubmit: *allow_resubmit,
                },
                submission: Default::default(),
            },
            TaskContent::DiscordTask {
                task_title,
                task_description,
                guild_id,
                invite_link,
                allow_resubmit,
            } => Self::DiscordTask {
                task_content: TaskContent::DiscordTask {
                    task_title: task_title.clone(),
                    task_description: task_description.clone(),
                    guild_id: guild_id.clone(),
                    invite_link: invite_link.clone(),
                    allow_resubmit: *allow_resubmit,
                },
                submission: Default::default(),
            },
        }
    }
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
    },
}

impl TaskType {
    pub fn submit(&mut self, user: Principal, submission: Submission) -> Result<(), Error> {
        let allow_resubmit = self.get_allow_resubmit();

        match self {
            TaskType::GenericTask { .. } => {
                if let Submission::Text { content } = &submission {
                    if content.trim().is_empty() {
                        return Err(Error::InvalidTaskContent(
                            "Submission cannot be empty".into(),
                        ));
                    }
                } else {
                    return Err(Error::IncorrectSubmission("Text".to_string()));
                }
            }
            TaskType::DiscordTask { .. } => {
                if let Submission::Discord { username, user_id } = &submission {
                    if username.trim().is_empty() || *user_id == 0 {
                        return Err(Error::InvalidTaskContent(
                            "Submission cannot be empty".into(),
                        ));
                    }
                } else {
                    return Err(Error::IncorrectSubmission("Discord".to_string()));
                }
            }
        };

        let submissions_map = match self {
            TaskType::GenericTask { submission, .. } | TaskType::DiscordTask { submission, .. } => {
                submission
            }
        };

        if let Some(existing_submission) = submissions_map.get(&user) {
            if existing_submission.get_state() == &SubmissionState::Rejected && allow_resubmit {
                submissions_map.remove(&user);
            } else {
                return Err(Error::UserAlreadySubmitted);
            }
        }

        submissions_map.insert(
            user,
            SubmissionData::new(submission, SubmissionState::default()),
        );

        Ok(())
    }

    pub fn accept(&mut self, user: Principal) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                task_content: _,
                submission: submissions_map,
            }
            | TaskType::DiscordTask {
                task_content: _,
                submission: submissions_map,
            } => {
                let submission = submissions_map
                    .get_mut(&user)
                    .ok_or(Error::UserSubmissionNotFound)?;
                submission.set_state(SubmissionState::Accepted);
            }
        }

        Ok(())
    }
    pub fn reject(&mut self, user: Principal, reason: Option<String>) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                task_content: _,
                submission: submissions_map,
            }
            | TaskType::DiscordTask {
                task_content: _,
                submission: submissions_map,
            } => {
                let submission = submissions_map
                    .get_mut(&user)
                    .ok_or(Error::UserSubmissionNotFound)?;
                submission.set_state(SubmissionState::Rejected);
                submission.set_rejection_reason(reason);
            }
        }

        Ok(())
    }

    pub fn get_submission(&self, user: Principal) -> Result<&SubmissionData, Error> {
        match self {
            TaskType::GenericTask {
                task_content: _,
                submission: submissions_map,
            }
            | TaskType::DiscordTask {
                task_content: _,
                submission: submissions_map,
            } => Ok(submissions_map
                .get(&user)
                .ok_or(Error::UserSubmissionNotFound)?),
        }
    }
    pub fn get_allow_resubmit(&self) -> bool {
        match self {
            TaskType::GenericTask { task_content, .. } => task_content.allow_resubmit(),
            TaskType::DiscordTask { task_content, .. } => task_content.allow_resubmit(),
        }
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
}

impl Task {
    pub async fn new(
        creator: Principal,
        create_task_args: CreateTaskArgs,
        subaccount: [u8; 32],
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
        minicbor::encode(self, &mut buf).expect("TaskId encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode TaskId bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Unbounded;
}
