use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use std::cell::RefCell;

type VMem = VirtualMemory<DefaultMemoryImpl>;

const USERS_MAP_MEMORY_ID: MemoryId = MemoryId::new(0);

thread_local! {
        static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    // Initialize a `StableBTreeMap` with `MemoryId(0)`.
    static USERS_MAP: RefCell<StableBTreeMap<Principal, u128, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MAP_MEMORY_ID)),
        )
    );
}