use ic_cdk::query;

use crate::{memory, state::State};

#[query]
pub fn get_state() -> State {
    memory::read_state(|state| state.clone())
}
