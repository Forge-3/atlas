use crate::memory::VMem;
use crate::memory::MEMORY_MANAGER;
use crate::memory::SPACES_VEC_MEMORY_ID;
use crate::Space;
use ic_stable_structures::StableVec;
use std::cell::RefCell;

thread_local! {
    static OLD_SPACES_VEC: RefCell<StableVec<Space, VMem>> = RefCell::new(
        StableVec::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(SPACES_VEC_MEMORY_ID)),
        ).expect("Failed to initialize old stable Vec")
    );
}

pub async fn migrate() {
    let new_spaces_data = OLD_SPACES_VEC.with_borrow(|spaces| {
        spaces
            .iter()
            .map(Some)
            .collect::<Vec<Option<Space>>>()
    });
    OLD_SPACES_VEC.with_borrow_mut(|spaces| {
        *spaces = StableVec::new(MEMORY_MANAGER.with(|m| m.borrow().get(SPACES_VEC_MEMORY_ID)))
            .expect("Failed to clear stable Vec")
    });
    let new_vec = StableVec::<Option<Space>, VMem>::new(
        MEMORY_MANAGER.with(|m| m.borrow().get(SPACES_VEC_MEMORY_ID)),
    )
    .expect("Failed to create new vec");

    for space in new_spaces_data {
        new_vec.push(&space).expect("Failed to push migrated data");
    }
}
