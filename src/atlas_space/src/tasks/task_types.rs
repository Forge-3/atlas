use crate::errors::Error;
use std::{borrow::Cow, collections::BTreeMap, fmt};

use crate::tasks::submission::{Submission, SubmissionData, SubmissionState};
use candid::{CandidType, Principal};
use ic_cdk_timers::TimerId;
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use serde::Serialize;
use slotmap::Key;
use slotmap::KeyData;

#[derive(Clone, Debug, Eq, PartialEq, CandidType, Serialize, Deserialize, Decode, Encode)]
pub struct TimerKeyData(#[n(0)] pub u64);

impl From<TimerId> for TimerKeyData {
    fn from(timer_id: TimerId) -> Self {
        let key_data = timer_id.data();
        TimerKeyData(key_data.as_ffi())
    }
}

impl TryFrom<TimerKeyData> for TimerId {
    type Error = Error;

    fn try_from(data: TimerKeyData) -> Result<Self, Self::Error> {
        let key_data = KeyData::from_ffi(data.0);
        Ok(TimerId::from(key_data))
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
        }
    }

    pub fn allow_resubmit(&self) -> bool {
        match self {
            TaskContent::TitleAndDescription { allow_resubmit, .. } => *allow_resubmit,
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
        let allow_resubmit = self.get_allow_resubmit();
        match self {
            TaskType::GenericTask {
                task_content: _,
                submission: submissions_map,
            } => {
                if let Some(existing_submission) = submissions_map.get(&user) {
                    if existing_submission.get_state() == &SubmissionState::Rejected
                        && allow_resubmit
                    {
                        submissions_map.remove(&user);
                    } else {
                        return Err(Error::UserAlreadySubmitted);
                    }
                }
                if !submission.is_text() {
                    return Err(Error::IncorrectSubmission("Text".to_string()));
                }
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

    pub fn reject(&mut self, user: Principal, reason: Option<String>) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
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

    pub fn clone_with_accepted_only(&self) -> Self {
        let mut cloned = self.clone();
        let map = cloned.get_submission_map_mut();
        for data in map.values_mut() {
            if data.get_state() != &SubmissionState::Accepted {
                data.clear_content();
            }
        }
        cloned
    }

    pub fn get_submission(&self, user: Principal) -> Result<&SubmissionData, Error> {
        self.get_submission_map()
            .get(&user)
            .ok_or(Error::UserSubmissionNotFound)
    }

    pub fn get_submission_map(&self) -> &BTreeMap<Principal, SubmissionData> {
        match self {
            TaskType::GenericTask { submission, .. } => submission,
        }
    }

    pub fn get_submission_map_mut(&mut self) -> &mut BTreeMap<Principal, SubmissionData> {
        match self {
            TaskType::GenericTask { submission, .. } => submission,
        }
    }

    pub fn get_allow_resubmit(&self) -> bool {
        match self {
            TaskType::GenericTask { task_content, .. } => task_content.allow_resubmit(),
        }
    }

    pub fn get_content(&self) -> &TaskContent {
        match self {
            TaskType::GenericTask { task_content, .. } => task_content,
        }
    }
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
