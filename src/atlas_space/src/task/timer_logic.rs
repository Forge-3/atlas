use ic_cdk_timers::set_timer;
use std::time::Duration;
use crate::task::TaskId;
use crate::memory::{with_open_tasks_iter, mut_open_task, remove_open_task, insert_closed_task, get_open_task};
use crate::errors::Error;
use ic_cdk_timers::TimerId;
use crate::task::ClosedTask;
use sha2::Digest;
use ic_stable_structures::Storable;
use crate::task::Task;

pub async fn reinitialize_task_timers_after_upgrade() {
    ic_cdk::println!("Reinitialize timers for tasks");

    let now_sec = ic_cdk::api::time() / 1_000_000_000;
    let tasks: Vec<(TaskId, Task)> = {
        let mut collected = Vec::new();
        with_open_tasks_iter(|iter| {
            for (task_id, task) in iter {
                collected.push((task_id.clone(), task.clone()));
            }
        });
        collected
    };

    for (task_id, task) in tasks {
        if let Ok(expired) = close_task_if_expired(task_id.clone()).await {
            if expired {
                continue;
            }
        }

        let end_time = task.end_time();
        let delay_sec = end_time.saturating_sub(now_sec);
        let timer_id = set_timer(Duration::from_secs(delay_sec), {
            let id = task_id.clone();
            move || {
                let _ = close_task(id);
            }
        });

        let _ = mut_open_task(task_id.clone(), |maybe_task| {
            if let Some(t) = maybe_task.as_mut() {
                t.set_timer_id(timer_id.into());
            }
            Ok::<(), Error>(())
        });
    }
}

pub fn schedule_close_task_timer(task_id: TaskId, end_time_sec: u64) -> TimerId {
    let now_sec = ic_cdk::api::time() / 1_000_000_000;
    let delay_sec = end_time_sec.saturating_sub(now_sec);

    set_timer(Duration::from_secs(delay_sec), {
        let id = task_id.clone();
        move || {
            ic_cdk::spawn(async move {
                let _ = close_task(id).await;
            });
        }
    })
}

pub async fn close_task(task_id: TaskId) -> Result<(), Error> {
    let task = remove_open_task(&task_id)?;
    if let Some(timer_key_data) = task.timer_id() {
        match TimerId::try_from(timer_key_data.clone()) {
            Ok(timer_id) => ic_cdk_timers::clear_timer(timer_id),
            Err(e) => return Err(e),
        }
    }
    
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
    let mut closed_task: ClosedTask = task.into();
    closed_task.claim_remains(subaccount).await?;
    insert_closed_task(task_id, closed_task)?;

    Ok(())
}

pub async fn close_task_if_expired(task_id: TaskId) -> Result<bool, Error> {
    let task = get_open_task(&task_id).ok_or(Error::TaskNotFound(task_id))?;

    if task.is_expired() {
        close_task(task_id).await?;
        Ok(true)
    } else {
        Ok(false)
    }
}