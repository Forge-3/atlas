use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell, StableVec};
use std::cell::RefCell;

use crate::config::Config;
use crate::errors::Error;
use crate::space::Space;
use crate::user::{Rank, User};

type VMem = VirtualMemory<DefaultMemoryImpl>;

pub const CONFIG_MEMORY_ID: MemoryId = MemoryId::new(0);
pub const USERS_MAP_MEMORY_ID: MemoryId = MemoryId::new(1);
pub const SPACES_VEC_MEMORY_ID: MemoryId = MemoryId::new(2);
pub const SPACES_WASM_MEMORY_ID: MemoryId = MemoryId::new(3);

thread_local! {
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

   static CONFIG: RefCell<StableCell<Option<Config>, VMem>> = MEMORY_MANAGER
   .with(|m|
       RefCell::new(
            StableCell::init(
               m.borrow().get(CONFIG_MEMORY_ID),
               None
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
            MEMORY_MANAGER.with(|m| m.borrow().get(SPACES_VEC_MEMORY_ID)),
        ).expect("Failed to initialize stable Vec")
    );

    static WASM_SPACES_MAP: RefCell<StableBTreeMap<u64, Vec<u8>, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(SPACES_WASM_MEMORY_ID)),
        )
    );
}

// User state methods

pub fn mut_user(
    user_id: Principal,
    f: impl FnOnce(Option<User>) -> Result<User, Error>,
) -> Result<Option<User>, Error> {
    USERS_MAP.with_borrow_mut(|users| Ok(users.insert(user_id, f(users.get(&user_id))?)))
}

pub fn insert_user(user_id: Principal, user_data: User) -> Option<User> {
    USERS_MAP.with_borrow_mut(|users| users.insert(user_id, user_data))
}

pub fn user_rank_match(user_id: &Principal, rank: &[Rank]) -> Result<User, Error> {
    USERS_MAP.with_borrow(|users| {
        users
            .get(user_id)
            .filter(|user| rank.contains(user.rank()))
            .ok_or(Error::UserRankNoMatch(rank.to_vec()))
    })
}

pub fn get_user(user_id: &Principal) -> Option<User> {
    USERS_MAP.with_borrow(|users| users.get(user_id))
}

// Config state methods

pub fn read_config<R>(f: impl FnOnce(&Config) -> R) -> R {
    CONFIG.with_borrow(|s| f(s.get().as_ref().expect("Config is not set")))
}

pub fn set_config(config: Config) -> Result<(), Error> {
    CONFIG
        .with_borrow_mut(|users| users.set(Some(config)))
        .map_err(|err| Error::FailedToUpdateConfig(format!("{:?}", err)))?;
    Ok(())
}

pub fn mut_config<T>(f: impl FnOnce(&mut Option<Config>) -> T) -> T {
    CONFIG.with_borrow_mut(|s| {
        let mut config = s.get().clone();
        let result = f(&mut config);
        s.set(config).expect("Failed to update config");
        result
    })
}

// Spaces Vec state methods

pub fn get_space_vec_len() -> u64 {
    SPACES_VEC.with_borrow(|space| space.len())
}

pub fn with_space_vec_iter<F, R>(f: F) -> R
where
    F: for<'a> FnOnce(Box<dyn Iterator<Item = Space> + 'a>) -> R,
{
    SPACES_VEC.with_borrow(|space| f(Box::new(space.iter())))
}

pub fn get_space(space_index: u64) -> Option<Space> {
    SPACES_VEC.with_borrow(|space| space.get(space_index))
}

pub fn push_space(space_principal: &Space) -> Result<(), Error> {
    SPACES_VEC
        .with_borrow_mut(|space| space.push(space_principal))
        .map_err(|err| Error::FailedToSaveSpace(format!("{:?}", err)))?;
    Ok(())
}

// Spaces WASM

pub fn insert_new_version(version: u64, bytecode: Vec<u8>) {
    if WASM_SPACES_MAP
        .with_borrow_mut(|code_map| code_map.insert(version, bytecode))
        .is_some()
    {
        ic_cdk::trap("Fatal: Old bytecode was overwritten!")
    }
}

pub fn get_bytecode_by_version(version: &u64) -> Option<Vec<u8>> {
    WASM_SPACES_MAP.with_borrow(|code_map| code_map.get(version))
}
