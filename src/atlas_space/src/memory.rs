use crate::config::Config;
use crate::errors::Error;
use crate::state::State;
use crate::task::{Task, TaskId};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell};
use std::cell::RefCell;

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
           ).expect("Failed to initialize stable Cell.")
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
    CONFIG.with_borrow(|s| f(s.get().as_ref().expect("Config is not set!")))
}

pub fn set_config(config: Config) -> Result<(), Error> {
    CONFIG
        .with_borrow_mut(|users| users.set(Some(config)))
        .map_err(|err| Error::FailedToUpdateConfig(format!("{:?}", err)))?;
    Ok(())
}

pub fn mut_config<T>(f: impl FnOnce(&mut Config) -> T) -> T {
    CONFIG.with_borrow_mut(|s| {
        let mut config = s.get().clone().expect("Config is not set?!");
        let result = f(&mut config);
        s.set(Some(config)).expect("Failed to update config");
        result
    })
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
        s.set(state).expect("Failed to update state?!");
        result
    })
}

// Open task methods

pub fn insert_open_task(task_id: TaskId, new_task: Task) -> Result<(), Error> {
    OPEN_TASKS_MAP.with_borrow_mut(|tasks| {
        if tasks.contains_key(&task_id) {
            return Err(Error::TaskAlreadyExists(task_id));
        }
        tasks.insert(task_id, new_task);
        Ok(())
    })
}

pub fn mut_open_task<F, R>(task_id: TaskId, f: F) -> Result<R, Error>
where
    F: FnOnce(&mut Option<Task>) -> R,
{
    OPEN_TASKS_MAP.with_borrow_mut(|tasks| {
        let mut task = tasks.get(&task_id);
        let result = f(&mut task);

        if let Some(task) = task {
            tasks.insert(task_id, task);
        }

        Ok(result)
    })
}

pub fn with_open_tasks_iter<F, R>(f: F) -> R
where
    F: for<'a> FnOnce(Box<dyn Iterator<Item = (TaskId, Task)> + 'a>) -> R,
{
    OPEN_TASKS_MAP.with_borrow(|tasks| f(Box::new(tasks.iter())))
}

pub fn get_open_tasks(task_id: &TaskId) -> Option<Task> {
    OPEN_TASKS_MAP.with_borrow_mut(|tasks| tasks.get(task_id))
}

pub fn get_open_tasks_len() -> u64 {
    OPEN_TASKS_MAP.with_borrow(|tasks| tasks.len())
}

// Closed task methods

pub fn insert_closed_task(task_id: TaskId, new_task: Task) -> Result<(), Error> {
    OPEN_TASKS_MAP.with_borrow_mut(|tasks| {
        if tasks.contains_key(&task_id) {
            return Err(Error::TaskAlreadyExists(task_id));
        }
        tasks.insert(task_id, new_task);
        Ok(())
    })
}

pub fn with_closed_tasks_iter<F, R>(f: F) -> R
where
    F: for<'a> FnOnce(Box<dyn Iterator<Item = (TaskId, Task)> + 'a>) -> R,
{
    OPEN_TASKS_MAP.with_borrow(|tasks| f(Box::new(tasks.iter())))
}

pub fn get_closed_tasks_len() -> u64 {
    OPEN_TASKS_MAP.with_borrow(|tasks| tasks.len())
}
