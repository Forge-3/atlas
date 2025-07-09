use crate::tasks::task::Task;
use crate::tasks::timer_logic;
use crate::CreateTaskArgs;
use crate::Submission;
use crate::TaskId;
use crate::{
    errors::Error,
    guard::{parent_guard, parent_or_owner_or_admin_guard, user_is_in_space},
    memory,
    state::EditSpaceArgs,
};
use candid::Principal;
use ic_cdk::update;
use ic_stable_structures::Storable;
use sha2::Digest;
use crate::CreateTaskArgs;
use crate::TaskId;
use crate::Submission;
use crate::task::timer_logic;
use crate::task::task::Task;

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
pub async fn set_space_background(background: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_background(background));
    Ok(())
}

#[update]
pub async fn edit_space(edit_space_args: EditSpaceArgs) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.edit_space(edit_space_args));
    Ok(())
}

#[update]
pub async fn create_task(args: CreateTaskArgs) -> Result<TaskId, Error> {
    let caller = parent_or_owner_or_admin_guard().await?;
    args.validate()?;
    let next_task_id = memory::mut_state(|state| TaskId::new(state.get_next_task_id()));
    let subaccount = sha2::Sha256::digest(next_task_id.u64().to_bytes()).into();

    let timer_id = timer_logic::schedule_close_task_timer(next_task_id, args.end_time);

    memory::insert_open_task(
        next_task_id,
        Task::new(caller, args, subaccount, timer_id.into())
            .await
            .unwrap(),
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

    let expired = timer_logic::close_task_if_expired(task_id).await?;
    if expired {
        return Err(Error::TaskExpired);
    }

    memory::mut_open_task(task_id, |maybe_task| {
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
    memory::mut_open_task(task_id, |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.accept_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    let mut task = memory::get_open_task(&task_id).ok_or(Error::TaskDoNotExists(task_id))?;
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();

    ic_cdk::println!("Trying to claim rewards");
    match task.claim_reward(user, subaccount).await {
        Ok(_) => ic_cdk::println!("Reward distributed."),
        Err(_) => ic_cdk::println!("Failed to distribute reward"),
    }

    memory::mut_open_task(task_id, |maybe_task| {
        let task_in_memory = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        *task_in_memory = task.clone();
        Ok(())
    })??;

    let number_of_uses: usize = task
        .number_of_uses
        .try_into()
        .expect("u64 do not fit in usize?");
    if number_of_uses == task.rewarded.len() {
        ic_cdk::println!("All rewards distributed. Closing task {task_id}");
        timer_logic::force_close_task(task_id).await?;
    }

    Ok(())
}

#[update]
pub async fn reject_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
    reason: Option<String>,
) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    memory::mut_open_task(task_id, |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.reject_subtask_submission(user, subtask_id, reason)?;
        Ok(())
    })??;

    Ok(())
}

#[update]
pub async fn withdraw_reward(task_id: TaskId) -> Result<(), Error> {
    let caller = user_is_in_space().await?;
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();

    if let Some(mut task) = memory::get_open_task(&task_id) {
        task.claim_reward(caller, subaccount).await?;

        memory::mut_open_task(task_id, |maybe_task| {
            let task_mut = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
            *task_mut = task;
            Ok(())
        })??;

        return Ok(());
    }

    if let Some(mut task) = memory::get_closed_task(&task_id) {
        task.claim_reward(caller, subaccount).await?;

        memory::mut_closed_task(task_id, |maybe_task| {
            let task_mut = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
            *task_mut = task;
            Ok(())
        })??;

        return Ok(());
    }

    Err(Error::TaskDoNotExists(task_id))
}

#[update]
pub async fn force_close_task(task_id: TaskId) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    timer_logic::force_close_task(task_id).await?;
    Ok(())
}

#[update]
pub async fn delete_closed_task(task_id: TaskId) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    let mut closed_task =
        memory::get_closed_task(&task_id).ok_or(Error::TaskDoNotExists(task_id))?;
    closed_task.claim_all_rewards(task_id).await?;
    memory::delete_closed_task(&task_id).expect("Failed to remove closed task");
    Ok(())
}

#[update]
pub fn transfer_space(to: Principal) {
    parent_guard().unwrap();

    memory::mut_config(|config| config.owner = to);
}
