use crate::{errors::Error, guard::admin_or_owner_guard, memory, state::State, task::{token_reward::TokenReward, xp_reward::XpReward, TaksId, Task}};
use candid::CandidType;
use ic_cdk::update;
use serde::Deserialize;

#[update]
pub fn set_space_name(name: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_name(name));
    Ok(())
}

#[update]
pub fn set_space_description(description: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_description(description));
    Ok(())
}

#[update]
pub fn set_space_logo(logo: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_logo(logo));
    Ok(())
}

#[update]
pub fn set_space_background(space_background: String) -> Result<(), Error> {
    admin_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_background(space_background));
    Ok(())
}

#[derive(CandidType, Deserialize)]
pub struct CreateTaskArgs {
    task_title: String,
    token_reward: Option<TokenReward>,
    xp_reward: Option<XpReward>
}

#[update]
pub fn create_task(args: CreateTaskArgs) -> Result<(), Error> {
    let caller = admin_or_owner_guard()?;
    let next_task_id = memory::mut_state(|state| {
        TaksId::new(state.get_next_task_id())
    });
    memory::insert_task(next_task_id, Task::new(
        caller,
        args.token_reward,
        args.xp_reward
    )).unwrap();
    
    Ok(())
}