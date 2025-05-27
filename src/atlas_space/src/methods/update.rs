use crate::{
    errors::Error,
    guard::{parent_or_owner_guard, authenticated_guard},
    memory,
    task::{submission::Submission, CreateTaskArgs, Task, TaskId},
};
use candid::Encode;
use ic_cdk::{
    api::management_canister::main::{CanisterInstallMode, InstallCodeArgument},
    update,
};
use ic_stable_structures::Storable;
use sha2::Digest;

#[update]
pub fn set_space_name(name: String) -> Result<(), Error> {
    parent_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_name(name));
    Ok(())
}

#[update]
pub fn set_space_description(description: String) -> Result<(), Error> {
    parent_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_description(description));
    Ok(())
}

#[update]
pub fn set_space_logo(logo: String) -> Result<(), Error> {
    parent_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_logo(logo));
    Ok(())
}

#[update]
pub fn set_space_background(space_background: String) -> Result<(), Error> {
    parent_or_owner_guard()?;

    memory::mut_state(|state| state.set_space_background(space_background));
    Ok(())
}

#[update]
pub async fn create_task(args: CreateTaskArgs) -> Result<TaskId, Error> {
    let caller = parent_or_owner_guard()?;
    args.validate()?;
    let next_task_id = memory::mut_state(|state| TaskId::new(state.get_next_task_id()));

    let subaccount: [u8; 32] = sha2::Sha256::digest(next_task_id.u64().to_bytes()).into();
    memory::insert_open_task(
        next_task_id.clone(),
        Task::new(caller, args, subaccount).await.unwrap(),
    )
    .unwrap();

    Ok(next_task_id)
}

#[update]
pub fn submit_subtask_submission(
    task_id: TaskId,
    subtask_id: usize,
    submission: Submission,
) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.submit_subtask_submission(caller, subtask_id, submission)?;

        Ok(())
    })??;

    Ok(())
}
