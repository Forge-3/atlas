use crate::{
    errors::Error,
    guard::{parent_or_owner_or_admin_guard, user_is_in_space},
    memory,
    task::{submission::Submission, CreateTaskArgs, Task, TaskId},
};

use candid::Principal;
use ic_cdk::update;
use ic_stable_structures::Storable;
use sha2::Digest;

#[update]
pub async fn set_space_name(name: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_name(name));
    Ok(())
}

#[update]
pub async fn set_space_description(description: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_description(description));
    Ok(())
}

#[update]
pub async fn set_space_logo(logo: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_logo(logo));
    Ok(())
}

#[update]
pub async fn set_space_background(space_background: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_background(space_background));
    Ok(())
}

#[update]
pub async fn create_task(args: CreateTaskArgs) -> Result<TaskId, Error> {
    let caller = parent_or_owner_or_admin_guard().await?;
    args.validate()?;
    let next_task_id = memory::mut_state(|state| TaskId::new(state.get_next_task_id()));

    let subaccount = sha2::Sha256::digest(next_task_id.u64().to_bytes()).into();
    memory::insert_open_task(
        next_task_id.clone(),
        Task::new(caller, args, subaccount).await.unwrap(),
    )
    .unwrap();

    Ok(next_task_id)
}

#[update]
pub async fn submit_subtask_submission(
    task_id: TaskId,
    subtask_id: usize,
    submission: Submission,
) -> Result<(), Error> {
    let caller = user_is_in_space().await?;
    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.submit_subtask_submission(caller, subtask_id, submission)?;

        Ok(())
    })??;

    Ok(())
}

#[update]
pub async fn accept_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.accept_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    Ok(())
}

#[update]
pub async fn reject_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.reject_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    Ok(())
}

#[update]
pub async fn withdraw_reward(task_id: TaskId) -> Result<(), Error> {
    let caller = user_is_in_space().await?;
    let mut old_task = memory::get_open_tasks(&task_id).ok_or(Error::TaskDoNotExists(task_id))?;
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
    old_task.claim_reward(caller, subaccount).await?;

    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        *task = old_task;
        Ok(())
    })??;
    Ok(())
}
