use crate::guard::user_has_available_referrals;
use crate::tasks::task::validate_task_time_edit;
use crate::tasks::task::EditTaskArgs;
use crate::tasks::task::Task;
use crate::tasks::task_types::TaskType;
use crate::tasks::timer_logic;
use crate::update_helpers::{accept_expired_subtask_submission, accept_open_subtask_submission};
use crate::CreateTaskArgs;
use crate::Submission;
use crate::TaskId;
use crate::{
    errors::Error,
    guard::{parent_guard, parent_or_owner_or_admin_guard, user_is_in_space},
    memory,
    state::EditSpaceArgs,
    tasks::closed_task::ClosedTask,
};
use candid::Principal;
use ic_cdk::update;
use ic_cdk_timers::TimerId;
use ic_stable_structures::Storable;
use sha2::Digest;
use std::collections::BTreeMap;

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

    let timer_id = timer_logic::schedule_expire_task_timer(next_task_id, args.end_time);

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

    let expired = timer_logic::expire_task_if_expired(task_id).await?;
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
    if memory::get_open_task(&task_id).is_some() {
        accept_open_subtask_submission(user, task_id, subtask_id).await
    } else {
        accept_expired_subtask_submission(user, task_id, subtask_id).await
    }
}

#[update]
pub async fn reject_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
    reason: Option<String>,
) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    let (task, is_open) = memory::get_open_task(&task_id)
        .map(|t| (t, true))
        .or_else(|| memory::get_expired_task(&task_id).map(|t| (t, false)))
        .ok_or(Error::TaskDoNotExists(task_id))?;

    if task.is_fully_rewarded() {
        return Err(Error::AllRewardsClaimed);
    }

    if is_open {
        memory::mut_open_task(task_id, |maybe_task| {
            let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
            task.reject_subtask_submission(user, subtask_id, reason)?;
            Ok(())
        })??;
    } else {
        memory::mut_expired_task(task_id, |maybe_task| {
            let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
            task.reject_subtask_submission(user, subtask_id, reason)?;
            Ok(())
        })??;
    }

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

    if let Some(mut task) = memory::get_expired_task(&task_id) {
        task.claim_reward(caller, subaccount).await?;

        memory::mut_expired_task(task_id, |maybe_task| {
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
pub async fn edit_task(args: EditTaskArgs) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    args.validate()?;

    let mut task =
        memory::get_open_task(&args.task_id).ok_or(Error::TaskDoNotExists(args.task_id))?;

    let new_start_time = args.start_time.unwrap_or(task.start_time);
    let new_end_time = args.end_time.unwrap_or(task.end_time);
    validate_task_time_edit(new_start_time, new_end_time)?;

    let mut maybe_new_tasks: Option<Vec<TaskType>> = None;
    if let Some(new_contents) = &args.task_content {
        let old_tasks_with_subs: BTreeMap<usize, &TaskType> = task
            .tasks
            .iter()
            .enumerate()
            .filter(|(_, task)| !task.get_submission_map().is_empty())
            .collect();

        if new_contents.len() < old_tasks_with_subs.len() {
            return Err(Error::InvalidTaskContent(
                "Cannot remove subtask with existing submissions".into(),
            ));
        }

        let mut new_tasks: Vec<TaskType> = Vec::new();
        for (i, content) in new_contents.iter().enumerate() {
            if let Some(old_task) = old_tasks_with_subs.get(&i) {
                let some_content = content.as_ref().ok_or({
                    Error::InvalidTaskContent(
                        "Cannot remove subtask with existing submissions".into(),
                    )
                })?;
                if old_task.get_content() != some_content {
                    return Err(Error::InvalidTaskContent(
                        "Cannot remove or modify subtask with existing submissions".into(),
                    ));
                }
                new_tasks.push((*old_task).clone());
                continue;
            }
            if content.is_none() {
                continue;
            }
            new_tasks.push(TaskType::from(content.as_ref().unwrap()));
        }

        maybe_new_tasks = Some(new_tasks);
    }

    let mut final_number_of_uses = task.number_of_uses;
    let mut final_token_reward = task.token_reward.clone();

    let already_rewarded = task.rewarded.len() as u64;
    if let Some(new_reward) = &args.token_reward {
        let any_submissions = task
            .tasks
            .iter()
            .any(|t| !t.get_submission_map().is_empty());
        if any_submissions {
            return Err(Error::InvalidTaskContent(
                "Cannot change token_reward because some subtasks already have submissions".into(),
            ));
        }
        final_token_reward = new_reward.clone();
    }

    if let Some(new_uses) = args.number_of_uses {
        if new_uses < already_rewarded {
            return Err(Error::InvalidTaskContent(format!(
                "Cannot set number_of_uses to {new_uses} because {already_rewarded} users already rewarded",
            )));
        }
        final_number_of_uses = new_uses;
    }

    if final_token_reward != task.token_reward || final_number_of_uses != task.number_of_uses {
        let subaccount = sha2::Sha256::digest(args.task_id.u64().to_bytes()).into();
        final_token_reward
            .adjust_reward(
                task.creator,
                subaccount,
                task.token_reward.clone(),
                task.number_of_uses,
                final_number_of_uses,
                already_rewarded,
            )
            .await?;
    }

    if let Some(new_end_time) = args.end_time {
        if new_end_time != task.end_time {
            if let Some(timer_id) = task.timer_id.take() {
                ic_cdk_timers::clear_timer(TimerId::try_from(timer_id)?);
            }

            let new_timer = timer_logic::schedule_expire_task_timer(args.task_id, new_end_time);
            task.timer_id = Some(new_timer.into());
        }
    }

    let prev_task_count = task.tasks.len();
    task.edit_task(&args, maybe_new_tasks.as_ref());
    if prev_task_count > task.tasks.len() {
        if let Err(e) = task.claim_all_rewards(args.task_id).await {
            ic_cdk::println!(
                "Failed to claim rewards for task {:?}: {:?}",
                args.task_id,
                e
            );
        }
    }

    memory::mut_open_task(args.task_id, |maybe_task| {
        let task_in_memory = maybe_task
            .as_mut()
            .ok_or(Error::TaskDoNotExists(args.task_id))?;
        *task_in_memory = task.clone();
        Ok(())
    })??;

    let number_of_uses: usize = task
        .number_of_uses
        .try_into()
        .expect("u64 do not fit in usize?");

    if number_of_uses == task.rewarded.len() {
        ic_cdk::println!("All rewards distributed. Closing task {}", args.task_id);
        timer_logic::force_expire_task(args.task_id).await?;
    }

    Ok(())
}

#[update]
pub async fn force_expire_task(task_id: TaskId) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    timer_logic::force_expire_task(task_id).await?;
    Ok(())
}

#[update]
pub async fn close_task(task_id: TaskId) -> Result<(), Error> {
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

#[update]
pub async fn clean_up_space_before_deletion() -> Result<(), String> {
    parent_guard().map_err(|e| e.to_string())?;

    let open_tasks: Vec<(TaskId, Task)> = memory::get_all_open_tasks();
    for (task_id, _) in &open_tasks {
        timer_logic::force_expire_task(*task_id)
            .await
            .map_err(|e| format!("Failed to expire task {task_id:?}: {e:?}"))?;
    }

    let expired_tasks: Vec<(TaskId, Task)> = memory::get_all_expired_tasks();
    for (task_id, _) in &expired_tasks {
        timer_logic::force_close_task(*task_id)
            .await
            .map_err(|e| format!("Failed to close task {task_id:?}: {e:?}"))?;
    }

    let mut errors = Vec::new();
    let closed_tasks: Vec<(TaskId, ClosedTask)> = memory::get_all_closed_tasks();

    for (task_id, mut closed_task) in closed_tasks {
        if let Err(err) = closed_task.claim_all_rewards(task_id).await {
            ic_cdk::println!("Failed to claim rewards for task {:?}: {:?}", task_id, err);
            errors.push(format!("Task {task_id:?}: {err:?}"));
        }
    }

    if !errors.is_empty() {
        return Err(format!(
            "Failed to claim rewards for {} tasks: {:?}",
            errors.len(),
            errors
        ));
    }

    Ok(())
}

#[update]
pub async fn register_task_referral(task_id: TaskId, inviter: Principal) -> Result<(), Error> {
    let invitee: Principal = user_is_in_space().await?;
    user_has_available_referrals(task_id.u64(), inviter).await?;
    memory::mut_open_task(task_id, |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.register_referral(inviter, invitee)?;
        Ok(())
    })??;

    Ok(())
}
