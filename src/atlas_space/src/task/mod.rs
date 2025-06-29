use std::{borrow::Cow, collections::BTreeMap, fmt};

use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use sha2::Digest;
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
            .try_for_each(|content| content.validate())
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

impl From<&TaskContent> for TaskType {
    fn from(content: &TaskContent) -> Self {
        match content {
            TaskContent::TitleAndDescription {
                task_title,
                task_description,
            } => Self::GenericTask {
                task_content: TaskContent::TitleAndDescription {
                    task_title: task_title.clone(),
                    task_description: task_description.clone(),
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
}

impl TaskType {
    pub fn submit(&mut self, user: Principal, submission: Submission) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                task_content: _,
                submission: submissions_map,
            } => {
                if submissions_map.contains_key(&user) {
                    return Err(Error::UserAlreadySubmitted);
                }
                if !submission.is_text() {
                    return Err(Error::IncorrectSubmission("Text".to_string()));
                }
                match &submission {
                    Submission::Text { content } => content.trim().len(),
                };

                submissions_map.insert(
                    user,
                    SubmissionData::new(submission, SubmissionState::default()),
                );
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
    tasks: Vec<TaskType>,
    #[n(3)]
    number_of_uses: u64,
    #[n(4)]
    task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    rewarded: Vec<Principal>,
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
