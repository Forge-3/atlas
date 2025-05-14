use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell};
use std::cell::RefCell;

use crate::config::Config;
use crate::errors::Error;
use crate::state::State;
use crate::task::{Task, TaskId};

type VMem = VirtualMemory<DefaultMemoryImpl>;

const CONFIG_MEMORY_ID: MemoryId = MemoryId::new(0);
const STATE_MEMORY_ID: MemoryId = MemoryId::new(1);

const OPEN_TASKS_MAP_MEMORY_ID: MemoryId = MemoryId::new(2);
const CLOSED_TASKS_MAP_MEMORY_ID: MemoryId = MemoryId::new(3);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

   static CONFIG: RefCell<StableCell<Option<Config>, VMem>> = MEMORY_MANAGER
   .with(|m|
       RefCell::new(
            StableCell::init(
               m.borrow().get(CONFIG_MEMORY_ID),
               Default::default()
           ).expect("Failed to initialize stable Cell")
       )
   );

   static STATE: RefCell<StableCell<State, VMem>> = MEMORY_MANAGER
   .with(|m|
       RefCell::new(
            StableCell::init(
               m.borrow().get(STATE_MEMORY_ID),
               Default::default()
           ).expect("Failed to initialize stable Cell")
       )
   );

   static OPEN_TASKS_MAP: RefCell<StableBTreeMap<TaskId, Task, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(OPEN_TASKS_MAP_MEMORY_ID)),
        )
    );
    static CLOSED_TASKS_MAP: RefCell<StableBTreeMap<TaskId, Task, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(CLOSED_TASKS_MAP_MEMORY_ID)),
        )
    );
}

// Config methods

pub fn read_config<R>(f: impl FnOnce(&Config) -> R) -> R {
    CONFIG.with_borrow(|s| f(s.get().as_ref().expect("Config is not set")))
}

pub fn set_config(config: Config) -> Result<(), Error> {
    CONFIG
        .with_borrow_mut(|users| users.set(Some(config)))
        .map_err(|err| Error::FailedToUpdateConfig(format!("{:?}", err)))?;
    Ok(())
}

// State methods

pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with_borrow(|s| f(s.get()))
}

pub fn set_state(state: State) -> Result<(), Error> {
    STATE
        .with_borrow_mut(|users| users.set(state))
        .map_err(|err| Error::FailedToUpdateConfig(format!("{:?}", err)))?;
    Ok(())
}

pub fn mut_state<T>(f: impl FnOnce(&mut State) -> T) -> T {
    STATE.with_borrow_mut(|s| {
        let mut state = s.get().clone();
        let result = f(&mut state);
        s.set(state).expect("Failed to update state");
        result
    })
}

// Open task methods

pub fn insert_task(task_id: TaskId, new_task: Task) -> Result<(), Error> {
    OPEN_TASKS_MAP.with_borrow_mut(|tasks| {
        if tasks.contains_key(&task_id) {
            return Err(Error::TaskAlreadyExists(task_id));
        }
        tasks.insert(task_id, new_task);
        Ok(())
    })
}
