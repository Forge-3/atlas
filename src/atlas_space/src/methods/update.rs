use crate::{
    errors::Error,
    guard::admin_or_owner_guard,
    memory,
    state::State,
    task::{token_reward::TokenReward, xp_reward::XpReward, Task, TaskContent, TaskId},
};
use candid::CandidType;
use ic_cdk::update;
use ic_stable_structures::Storable;
use serde::Deserialize;
use sha2::Digest;

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
    pub token_reward: TokenReward,
    pub task_content: TaskContent,
    pub number_of_uses: u64,
}

#[update]
pub async fn create_task(args: CreateTaskArgs) -> Result<(), Error> {
    let caller = admin_or_owner_guard()?;
    let next_task_id = memory::mut_state(|state| TaskId::new(state.get_next_task_id()));

    let subaccount: [u8; 32] = sha2::Sha256::digest(next_task_id.u64().to_bytes()).into();
    memory::insert_task(
        next_task_id,
        Task::new(caller, args, subaccount).await.unwrap(),
    )
    .unwrap();

    Ok(())
}
