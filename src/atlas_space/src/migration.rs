use crate::memory::{VMem, CLOSED_TASKS_MAP_MEMORY_ID, MEMORY_MANAGER, OPEN_TASKS_MAP_MEMORY_ID};
use crate::tasks::closed_task::ClosedTask;
use crate::tasks::task::Task;
use crate::tasks::task_types::{TaskId, TaskType, TimerKeyData};
use crate::tasks::token_reward::TokenReward;
use candid::Principal;
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{StableBTreeMap, Storable};
use minicbor::{Decode, Encode};
use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::BTreeMap;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone)]
pub struct OldTask {
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
    pub(crate) start_time: u64,
    #[n(7)]
    pub(crate) end_time: u64,
    #[n(8)]
    pub(crate) timer_id: Option<TimerKeyData>,
}

impl Storable for OldTask {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("OldTask encoding failed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
            panic!("Failed to decode OldTask bytes {}: {e}", hex::encode(bytes))
        })
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone)]
pub struct OldClosedTask {
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

thread_local! {
    static OLD_OPEN_TASKS: RefCell<StableBTreeMap<TaskId, OldTask, VMem>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(OPEN_TASKS_MAP_MEMORY_ID)))
    );

    static OLD_CLOSED_TASKS: RefCell<StableBTreeMap<TaskId, OldClosedTask, VMem>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(CLOSED_TASKS_MAP_MEMORY_ID)))
    );
}

pub async fn migrate() {
    let old_open: BTreeMap<TaskId, OldTask> =
        OLD_OPEN_TASKS.with_borrow(|map| map.iter().collect());

    let new_open: BTreeMap<TaskId, Task> = old_open
        .into_iter()
        .map(|(id, old)| {
            let new_task = Task {
                creator: old.creator,
                token_reward: old.token_reward,
                tasks: old.tasks,
                number_of_uses: old.number_of_uses,
                task_title: old.task_title,
                rewarded: old.rewarded,
                start_time: old.start_time,
                end_time: old.end_time,
                timer_id: None,
                referrals: BTreeMap::new(),
                affiliate_uses: 0,
            };
            (id, new_task)
        })
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

    let old_closed: BTreeMap<TaskId, OldClosedTask> =
        OLD_CLOSED_TASKS.with_borrow(|map| map.iter().collect());

    let new_closed: BTreeMap<TaskId, ClosedTask> = old_closed
        .into_iter()
        .map(|(id, old)| {
            let new_task = ClosedTask {
                creator: old.creator,
                token_reward: old.token_reward,
                tasks: old.tasks,
                number_of_uses: old.number_of_uses,
                task_title: old.task_title,
                rewarded: old.rewarded,
                start_time: old.start_time,
                end_time: old.end_time,
                refunded: old.refunded,
                referrals: BTreeMap::new(),
                affiliate_uses: 0,
            };
            (id, new_task)
        })
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
}
