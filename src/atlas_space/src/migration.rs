use crate::memory::{VMem, CLOSED_TASKS_MAP_MEMORY_ID, MEMORY_MANAGER, OPEN_TASKS_MAP_MEMORY_ID};
use crate::tasks::{
    closed_task::ClosedTask,
    submission::{Submission, SubmissionData, SubmissionState},
    task::Task,
    task_types::{AnswerFormat, TaskContent, TaskId, TaskType, TimerKeyData},
    token_reward::TokenReward,
};
use candid::{CandidType, Principal};
use ic_stable_structures::{storable::Bound, StableBTreeMap, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use std::{borrow::Cow, cell::RefCell, collections::BTreeMap};

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType, Deserialize)]
pub enum OldSubmission {
    #[n(0)]
    Text {
        #[n(0)]
        content: String,
    },
    #[n(1)]
    Empty,
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType, Deserialize)]
pub enum OldTaskContent {
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

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct OldSubmissionData {
    #[n(0)]
    pub(crate) submission: OldSubmission,

    #[n(1)]
    pub(crate) state: SubmissionState,

    #[n(2)]
    pub(crate) rejection_reason: Option<String>,
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub enum OldTaskType {
    #[n(0)]
    GenericTask {
        #[n(0)]
        task_content: OldTaskContent,
        #[cbor(n(1), with = "shared::cbor::principal::b_tree_map")]
        submission: BTreeMap<Principal, OldSubmissionData>,
    },
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct OldTask {
    #[cbor(n(0), with = "shared::cbor::principal")]
    pub(crate) creator: Principal,
    #[n(1)]
    pub(crate) token_reward: TokenReward,
    #[n(2)]
    pub(crate) tasks: Vec<OldTaskType>,
    #[n(3)]
    pub(crate) number_of_uses: u64,
    #[n(4)]
    pub(crate) task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    pub(crate) rewarded: Vec<Principal>,
    #[n(6)]
    pub(crate) start_time: u64,
    #[n(7)]
    pub(crate) end_time: u64,
    #[n(8)]
    pub(crate) timer_id: Option<TimerKeyData>,
}

impl Storable for OldTask {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("OldTask encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
            panic!("failed to decode OldTask bytes {}: {e}", hex::encode(bytes))
        })
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone)]
pub struct OldClosedTask {
    #[cbor(n(0), with = "shared::cbor::principal")]
    pub(crate) creator: Principal,
    #[n(1)]
    pub(crate) token_reward: crate::tasks::token_reward::TokenReward,
    #[n(2)]
    pub(crate) tasks: Vec<OldTaskType>,
    #[n(3)]
    pub(crate) number_of_uses: u64,
    #[n(4)]
    pub(crate) task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    pub(crate) rewarded: Vec<Principal>,
    #[n(6)]
    pub(crate) start_time: u64,
    #[n(7)]
    pub(crate) end_time: u64,
    #[n(8)]
    pub(crate) refunded: bool,
}

impl Storable for OldClosedTask {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("OldClosedTask encoding failed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
            panic!(
                "Failed to decode OldClosedTask bytes {}: {e}",
                hex::encode(bytes)
            )
        })
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl From<OldSubmission> for Submission {
    fn from(old: OldSubmission) -> Self {
        match old {
            OldSubmission::Text { content } => Submission::Text { content },
            OldSubmission::Empty => Submission::Empty,
        }
    }
}

impl From<OldTaskContent> for TaskContent {
    fn from(old: OldTaskContent) -> Self {
        match old {
            OldTaskContent::TitleAndDescription {
                task_title,
                task_description,
                allow_resubmit,
            } => TaskContent::TitleAndDescription {
                task_title,
                task_description,
                allow_resubmit,
                answer_format: AnswerFormat::Paragraph,
            },
        }
    }
}

impl From<OldSubmissionData> for SubmissionData {
    fn from(old: OldSubmissionData) -> Self {
        SubmissionData {
            submission: old.submission.into(),
            state: old.state,
            rejection_reason: old.rejection_reason,
        }
    }
}

impl From<OldTaskType> for TaskType {
    fn from(old: OldTaskType) -> Self {
        match old {
            OldTaskType::GenericTask {
                task_content,
                submission,
            } => TaskType::GenericTask {
                task_content: task_content.into(),
                submission: submission
                    .into_iter()
                    .map(|(principal, old_data)| (principal, old_data.into()))
                    .collect(),
            },
        }
    }
}

impl From<OldTask> for Task {
    fn from(old: OldTask) -> Self {
        Task {
            creator: old.creator,
            token_reward: old.token_reward,
            tasks: old.tasks.into_iter().map(Into::into).collect(),
            number_of_uses: old.number_of_uses,
            task_title: old.task_title,
            rewarded: old.rewarded,
            start_time: old.start_time,
            end_time: old.end_time,
            timer_id: old.timer_id,
        }
    }
}

impl From<OldClosedTask> for ClosedTask {
    fn from(old: OldClosedTask) -> Self {
        ClosedTask {
            creator: old.creator,
            token_reward: old.token_reward,
            tasks: old.tasks.into_iter().map(Into::into).collect(),
            number_of_uses: old.number_of_uses,
            task_title: old.task_title,
            rewarded: old.rewarded,
            start_time: old.start_time,
            end_time: old.end_time,
            refunded: old.refunded,
        }
    }
}

thread_local! {
    static OLD_OPEN_TASKS: RefCell<StableBTreeMap<TaskId, OldTask, VMem>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(OPEN_TASKS_MAP_MEMORY_ID)))
    );

    static OLD_CLOSED_TASKS: RefCell<StableBTreeMap<TaskId, OldClosedTask, VMem>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(CLOSED_TASKS_MAP_MEMORY_ID)))
    );
}

pub async fn migrate() {
    // OpenTasks
    let old_open: BTreeMap<TaskId, OldTask> =
        OLD_OPEN_TASKS.with_borrow(|map| map.iter().collect());

    let new_open: BTreeMap<TaskId, Task> = old_open
        .into_iter()
        .map(|(id, old)| (id, old.into()))
        .collect();

    OLD_OPEN_TASKS.with_borrow_mut(|map| {
        *map =
            StableBTreeMap::new(MEMORY_MANAGER.with(|m| m.borrow().get(OPEN_TASKS_MAP_MEMORY_ID)))
    });

    let mut new_open_map = StableBTreeMap::<TaskId, Task, VMem>::new(
        MEMORY_MANAGER.with(|m| m.borrow().get(OPEN_TASKS_MAP_MEMORY_ID)),
    );

    for (id, task) in new_open {
        new_open_map.insert(id, task);
    }

    let _ = new_open_map.len();

    // ClosedTasks
    let old_closed: BTreeMap<TaskId, OldClosedTask> =
        OLD_CLOSED_TASKS.with_borrow(|map| map.iter().collect());

    let new_closed: BTreeMap<TaskId, ClosedTask> = old_closed
        .into_iter()
        .map(|(id, old)| (id, old.into()))
        .collect();

    OLD_CLOSED_TASKS.with_borrow_mut(|map| {
        *map =
            StableBTreeMap::new(MEMORY_MANAGER.with(|m| m.borrow().get(CLOSED_TASKS_MAP_MEMORY_ID)))
    });

    let mut new_closed_map = StableBTreeMap::<TaskId, ClosedTask, VMem>::new(
        MEMORY_MANAGER.with(|m| m.borrow().get(CLOSED_TASKS_MAP_MEMORY_ID)),
    );

    for (id, task) in new_closed {
        new_closed_map.insert(id, task);
    }

    let _ = new_closed_map.len();
}
