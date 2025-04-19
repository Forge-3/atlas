use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell, StableVec};
use std::cell::RefCell;

use crate::config::Config;
use crate::errors::Error;
use crate::space::Space;
use crate::user::{Rank, User};

type VMem = VirtualMemory<DefaultMemoryImpl>;

const CONFIG_MEMORY_ID: MemoryId = MemoryId::new(0);
const USERS_MAP_MEMORY_ID: MemoryId = MemoryId::new(1);
const SPACES_VEC_MEMORY_ID: MemoryId = MemoryId::new(2);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

   static CONFIG: RefCell<StableCell<Config, VMem>> = MEMORY_MANAGER
   .with(|m|
       RefCell::new(
            StableCell::init(
               m.borrow().get(CONFIG_MEMORY_ID),
               Config::default()
           ).expect("Failed to initialize stable Cell")
       )
   );

    static USERS_MAP: RefCell<StableBTreeMap<Principal, User, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MAP_MEMORY_ID)),
        )
    );

    static SPACES_VEC: RefCell<StableVec<Space, VMem>> = RefCell::new(
        StableVec::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(SPACES_VEC_MEMORY_ID))
        ).expect("Failed to initialize stable Vec")
    );
}

// User state methods

pub fn insert_user(user_id: Principal, user_data: User) {
    USERS_MAP.with_borrow_mut(|users| users.insert(user_id, user_data));
}

pub fn user_rank_match(user_id: &Principal, rank: &Rank) -> Result<User, Error> {
    USERS_MAP.with_borrow(|users| {
        users
            .get(&user_id)
            .filter(|user| user.rank() == rank)
            .ok_or(Error::UserRankNoMatch(rank.clone()))
    })
}

pub fn get_user(user_id: &Principal) -> Option<User> {
    USERS_MAP.with_borrow(|users| users.get(user_id))
}

// Config state methods

pub fn read_config<R>(f: impl FnOnce(&Config) -> R) -> R {
    CONFIG.with_borrow(|s| f(s.get()))
}

pub fn set_config(config: Config) -> Result<(), Error> {
    CONFIG
        .with_borrow_mut(|users| users.set(config))
        .map_err(|err| Error::FailedToUpdateConfig(format!("{:?}", err)))?;
    Ok(())
}
