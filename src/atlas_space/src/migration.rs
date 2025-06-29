use std::{borrow::Cow, cell::RefCell, collections::BTreeMap};

use candid::{CandidType, Principal};
use ic_stable_structures::{storable::Bound, BTreeMap as StableBTreeMap, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;

use crate::{
    memory::{VMem, CLOSED_TASKS_MAP_MEMORY_ID, MEMORY_MANAGER, OPEN_TASKS_MAP_MEMORY_ID},
    tasks::{
        closed_task::ClosedTask,
        submission::{Submission, SubmissionData, SubmissionState},
        task::Task,
        task_types::{TaskContent, TaskId, TaskType},
        timer_logic::{self, now_in_seconds},
        token_reward::TokenReward,
    },
};

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct OldSubmissionData {
    #[n(0)]
    submission: Submission,

    #[n(1)]
    state: SubmissionState,
}

impl OldSubmissionData {
    pub fn get_state(&self) -> &SubmissionState {
        &self.state
    }

    pub fn clear_content(&mut self) {
        self.submission = Submission::Empty;
    }
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

impl OldTaskType {
    pub fn get_submission_map_mut(&mut self) -> &mut BTreeMap<Principal, OldSubmissionData> {
        match self {
            OldTaskType::GenericTask { submission, .. } => submission,
        }
    }

    pub fn clone_with_accepted_only(&self) -> TaskType {
        let mut cloned = self.clone();
        let map = cloned.get_submission_map_mut();
        for data in map.values_mut() {
            if data.get_state() != &SubmissionState::Accepted {
                data.clear_content();
            }
        }

        match cloned {
            OldTaskType::GenericTask {
                task_content,
                submission,
            } => TaskType::GenericTask {
                task_content: match task_content {
                    OldTaskContent::TitleAndDescription {
                        task_title,
                        task_description,
                    } => TaskContent::TitleAndDescription {
                        task_title,
                        task_description,
                        allow_resubmit: false,
                    },
                },
                submission: submission
                    .iter()
                    .map(|(principal, sub)| {
                        (
                            *principal,
                            SubmissionData {
                                submission: sub.submission.clone(),
                                state: sub.state.clone(),
                                rejection_reason: None,
                            },
                        )
                    })
                    .collect(),
            },
        }
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType, Deserialize)]
pub enum OldTaskContent {
    #[n(0)]
    TitleAndDescription {
        #[n(0)]
        task_title: String,
        #[n(1)]
        task_description: String,
    },
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

thread_local! {
    static OLD_OPEN_TASKS_MAP: RefCell<StableBTreeMap<TaskId, OldTask, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(OPEN_TASKS_MAP_MEMORY_ID)),
        )
    );
    static OLD_CLOSED_TASKS_MAP: RefCell<StableBTreeMap<TaskId, OldTask, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(CLOSED_TASKS_MAP_MEMORY_ID)),
        )
    );

    static NEW_OPEN_TASKS_MAP: RefCell<StableBTreeMap<TaskId, Task, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(OPEN_TASKS_MAP_MEMORY_ID)),
        )
    );
    static NEW_CLOSED_TASKS_MAP: RefCell<StableBTreeMap<TaskId, ClosedTask, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(CLOSED_TASKS_MAP_MEMORY_ID)),
        )
    );
}

fn migrate_submission_map(
    old: &BTreeMap<Principal, OldSubmissionData>,
) -> BTreeMap<Principal, SubmissionData> {
    old.iter()
        .map(|(principal, old_data)| {
            (
                *principal,
                SubmissionData {
                    submission: old_data.submission.clone(),
                    state: old_data.state.clone(),
                    rejection_reason: None,
                },
            )
        })
        .collect()
}

pub async fn migrate() {
    let two_months_in_sec: u64 = 3 * 30 * 24 * 60 * 60;
    let now = now_in_seconds();
    let now_plus_two_months_in_sec = now + two_months_in_sec;

    // Migrate open tasks
    let new_open_tasks_vec: Vec<(TaskId, Task)> = OLD_OPEN_TASKS_MAP.with_borrow(|tasks| {
        tasks
            .iter()
            .map(|(key, old_task)| {
                let new_task = Task {
                    creator: old_task.creator,
                    token_reward: old_task.token_reward,
                    number_of_uses: old_task.number_of_uses,
                    task_title: old_task.task_title,
                    rewarded: old_task.rewarded,
                    tasks: old_task
                        .tasks
                        .iter()
                        .map(|task| match task {
                            OldTaskType::GenericTask {
                                task_content,
                                submission,
                            } => TaskType::GenericTask {
                                task_content: match task_content {
                                    OldTaskContent::TitleAndDescription {
                                        task_title,
                                        task_description,
                                    } => TaskContent::TitleAndDescription {
                                        task_title: task_title.clone(),
                                        task_description: task_description.clone(),
                                        allow_resubmit: false,
                                    },
                                },
                                submission: migrate_submission_map(submission),
                            },
                        })
                        .collect(),
                    start_time: now,
                    end_time: now_plus_two_months_in_sec,
                    timer_id: Some(
                        timer_logic::schedule_close_task_timer(key, now_plus_two_months_in_sec)
                            .into(),
                    ),
                };

                (key, new_task)
            })
            .collect()
    });
    OLD_OPEN_TASKS_MAP.with_borrow_mut(|tasks| tasks.clear_new());
    NEW_OPEN_TASKS_MAP.with_borrow_mut(|tasks| {
        new_open_tasks_vec.iter().for_each(|(key, value)| {
            tasks.insert(*key, value.clone());
        })
    });

    // Migrate closed tasks
    let new_closed_tasks_vec: Vec<(TaskId, ClosedTask)> =
        OLD_CLOSED_TASKS_MAP.with_borrow(|tasks| {
            tasks
                .iter()
                .map(|(key, old_task)| {
                    let task = ClosedTask {
                        creator: old_task.creator,
                        token_reward: old_task.token_reward,
                        tasks: old_task
                            .tasks
                            .into_iter()
                            .map(|task_type| task_type.clone_with_accepted_only())
                            .collect(),
                        number_of_uses: old_task.number_of_uses,
                        task_title: old_task.task_title,
                        rewarded: old_task.rewarded,
                        start_time: now,
                        end_time: now,
                        refunded: false,
                    };

                    (key, task)
                })
                .collect()
        });
    OLD_CLOSED_TASKS_MAP.with_borrow_mut(|tasks| tasks.clear_new());
    NEW_CLOSED_TASKS_MAP.with_borrow_mut(|tasks| {
        new_closed_tasks_vec.iter().for_each(|(key, value)| {
            tasks.insert(*key, value.clone());
        })
    });
}
