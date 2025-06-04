use std::{borrow::Cow, collections::BTreeMap, fmt};

use candid::{CandidType, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use submission::{Submission, SubmissionData, SubmissionState};
use token_reward::TokenReward;

use crate::errors::Error;

pub mod submission;
pub mod token_reward;
pub mod xp_reward;

#[derive(CandidType, Deserialize)]
pub struct CreateTaskArgs {
    pub task_title: String,
    pub token_reward: TokenReward,
    pub subtasks: Vec<CreateSubTaskArgs>,
    pub number_of_uses: u64,
}
#[derive(CandidType, Deserialize)]
pub struct CreateSubTaskArgs {
    pub kind: String,
    pub content: TaskContent,
}

impl CreateTaskArgs {
    pub fn validate(&self) -> Result<(), Error> {
        if self.task_title.trim().len() > 50 {
            return Err(Error::InvalidTaskContent(
                "Task title is too long (max length: 50)".into(),
            ));
        }
        if self.subtasks.len() > 10 {
            return Err(Error::InvalidTaskContent("Too many subtasks".into()));
        }
        self.subtasks
            .iter()
            .try_for_each(|subtask_arg| subtask_arg.content.validate())
    }
}
impl CreateSubTaskArgs {
    pub fn validate(&self) -> Result<(), Error> {
        match self.kind.as_str() {
            "generic" => self.content.validate(),
            "discord" => self.content.validate(),
            _ => Err(Error::InvalidTaskContent(format!(
                "Unknown subtask kind: {}",
                self.kind
            ))),
        }
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

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub enum TaskType {
    #[n(0)]
    GenericTask {
        #[n(0)]
        task_content: TaskContent,
        #[cbor(n(1), with = "shared::cbor::principal_map")]
        submission: BTreeMap<Principal, SubmissionData>,
    },
    #[n(1)]
    DiscordTask {
        #[n(0)]
        task_content: TaskContent,
        #[cbor(n(1), with = "shared::cbor::principal_map")]
        submission: BTreeMap<Principal, SubmissionData>,
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
            TaskType::DiscordTask { submission, .. } => {
                let Submission::Discord { access_token, guild_id } = submission_data else {
                    return Err(Error::IncorrectSubmission("Expected Discord submission".to_string()));
                };
                submission.insert(user, SubmissionData::new(Submission::Discord { access_token, guild_id }, SubmissionState::WaitingForReview));
                Ok(())
            }
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
    pub created_by: Principal,
    #[n(1)]
    pub created_at: u64,
    #[n(2)]
    pub title: String,
    #[n(3)]
    pub token_reward: TokenReward,
    #[n(4)]
    pub tasks: BTreeMap<usize, TaskType>,
    #[n(5)]
    pub number_of_uses: u64,
    #[n(6)]
    pub subaccount: [u8; 32],
}

impl Task {
    pub async fn new(
        caller: Principal,
        args: CreateTaskArgs,
        subaccount: [u8; 32],
    ) -> Result<Self, Error> {
        let mut tasks_map = BTreeMap::new();
        for (index, subtask_arg) in args.subtasks.into_iter().enumerate() {
            let task_type = match subtask_arg.kind.as_str() {
                "generic" => TaskType::GenericTask {
                    task_content: subtask_arg.content,
                    submission: BTreeMap::new(),
                },
                "discord" => TaskType::DiscordTask {
                    task_content: subtask_arg.content,
                    submission: BTreeMap::new(),
                },
                _ => return Err(Error::InvalidTaskContent("Unknown subtask kind".to_string())),
            };
            tasks_map.insert(index, task_type);
        }

        Ok(Self {
            created_by: caller,
            created_at: ic_cdk::api::time(),
            title: args.task_title,
            token_reward: args.token_reward,
            tasks: tasks_map,
            number_of_uses: args.number_of_uses,
            subaccount,
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
