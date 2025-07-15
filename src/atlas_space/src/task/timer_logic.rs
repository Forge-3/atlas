use crate::errors::Error;
use crate::memory::{
    get_open_task, insert_closed_task, mut_open_task, remove_open_task, with_open_tasks_iter,
};
use crate::task::closed_task::ClosedTask;
use crate::task::task::Task;
use crate::task::task_types::TaskId;
use ic_cdk_timers::set_timer;
use ic_cdk_timers::TimerId;
use ic_stable_structures::Storable;
use sha2::Digest;
use std::time::Duration;

pub async fn reinitialize_task_timers_after_upgrade() {
    ic_cdk::println!("Reinitialize timers for tasks");

    let now_sec = ic_cdk::api::time() / 1_000_000_000;
    let tasks: Vec<(TaskId, Task)> = with_open_tasks_iter(|iter| {
        iter.map(|(task_id, task)| (task_id.clone(), task.clone())).collect()
    });

    for (task_id, task) in tasks {
        if let Ok(expired) = close_task_if_expired(task_id.clone()).await {
            if expired {
                continue;
            }
        }

        let end_time = task.end_time;
        let delay_sec = end_time.saturating_sub(now_sec);
        let timer_id = set_timer(Duration::from_secs(delay_sec), {
            let id = task_id.clone();
            move || {
                ic_cdk::futures::spawn(async move {
                    if let Err(e) = close_task(id).await {
                        ic_cdk::println!("Failed to close task {:?}: {:?}", id, e);
                    }
                });
            }
        });

        if let Err(e) = mut_open_task(task_id.clone(), |maybe_task| {
            if let Some(t) = maybe_task.as_mut() {
                t.timer_id = Some(timer_id.into());
            }
            Ok::<(), Error>(())
        }) {
            ic_cdk::println!("Failed to update task {:?}: {:?}", task_id, e);
        }
    }
}

pub fn schedule_close_task_timer(task_id: TaskId, end_time_sec: u64) -> TimerId {
    let now_sec = ic_cdk::api::time() / 1_000_000_000;
    let delay_sec = end_time_sec.saturating_sub(now_sec);

    set_timer(Duration::from_secs(delay_sec), {
        let id = task_id.clone();
        move || {
            ic_cdk::futures::spawn(async move {
                if let Err(e) = close_task(id).await {
                    ic_cdk::println!("Failed to close task {:?}: {:?}", id, e);
                }
            });
        }
    })
}

pub async fn close_task(task_id: TaskId) -> Result<(), Error> {
    let task = remove_open_task(&task_id)?;
    if let Some(timer_key_data) = &task.timer_id {
        TimerId::try_from(timer_key_data.clone()).map(|timer_id| ic_cdk_timers::clear_timer(timer_id))?;
    }

    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
    let mut closed_task: ClosedTask = task.into();
    closed_task.claim_remains(subaccount).await?;
    insert_closed_task(task_id, closed_task)?;

    Ok(())
}

pub async fn close_task_if_expired(task_id: TaskId) -> Result<bool, Error> {
    let task = get_open_task(&task_id).ok_or(Error::TaskNotFound(task_id))?;
    let is_expired = task.is_expired();
    if is_expired {
        close_task(task_id).await?;
    }

    Ok(is_expired)
}
