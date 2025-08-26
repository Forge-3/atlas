use crate::errors::Error;
use crate::memory;
use crate::tasks::task_types::TaskId;
use crate::tasks::timer_logic;
use candid::Principal;
use ic_stable_structures::Storable;
use sha2::Digest;

pub async fn accept_open_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    memory::mut_open_task(task_id, |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        if task.is_fully_rewarded() {
            return Err(Error::AllRewardsClaimed);
        }
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
        let task_in_memory = maybe_task.as_mut().expect("Task should always exist here");
        *task_in_memory = task.clone();
        Ok(())
    })??;

    let number_of_uses: usize = task
        .number_of_uses
        .try_into()
        .expect("u64 do not fit in usize?");
    if number_of_uses == task.rewarded.len() {
        ic_cdk::println!("All rewards distributed. Expiring task {task_id}");
        timer_logic::force_expire_task(task_id).await?;
    }

    Ok(())
}

pub async fn accept_expired_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    memory::mut_expired_task(task_id, |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        if task.is_fully_rewarded() {
            return Err(Error::AllRewardsClaimed);
        }
        task.accept_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    let mut task = memory::get_expired_task(&task_id).ok_or(Error::TaskDoNotExists(task_id))?;

    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
    ic_cdk::println!("Trying to claim rewards");
    match task.claim_reward(user, subaccount).await {
        Ok(_) => ic_cdk::println!("Reward distributed."),
        Err(_) => ic_cdk::println!("Failed to distribute reward"),
    }

    memory::mut_expired_task(task_id, |maybe_task| {
        let task_in_memory = maybe_task.as_mut().expect("Task should always exist here");
        *task_in_memory = task.clone();
        Ok(())
    })??;

    Ok(())
}
