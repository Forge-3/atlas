use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableCell};
use std::cell::RefCell;

use crate::config::Config;
use crate::errors::Error;
use crate::state::State;

type VMem = VirtualMemory<DefaultMemoryImpl>;

const CONFIG_MEMORY_ID: MemoryId = MemoryId::new(0);
const STATE_MEMORY_ID: MemoryId = MemoryId::new(0);

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
}

// Config methods

pub fn read_config<R>(f: impl FnOnce(&Option<Config>) -> R) -> R {
    CONFIG.with_borrow(|s| f(s.get()))
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

pub fn mut_state(f: impl FnOnce(&State) -> State) -> Result<(), Error> {
    STATE
        .with_borrow_mut(|s| s.set(f(s.get())))
        .map_err(|err| Error::FailedToUpdateConfig(format!("{:?}", err)))?;
    Ok(())
}
