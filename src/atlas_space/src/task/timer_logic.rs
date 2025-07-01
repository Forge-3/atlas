use ic_cdk_timers::set_timer;
use std::time::Duration;
use crate::task::TaskId;
use crate::memory::{with_open_tasks_iter, mut_open_task, remove_open_task, insert_closed_task, get_open_task};
use crate::errors::Error;
use ic_cdk_timers::TimerId;
use crate::task::ClosedTask;

pub async fn reinitialize_task_timers_after_upgrade() {
    ic_cdk::println!("Reinitialize timers for tasks");

    let now_sec = ic_cdk::api::time() / 1_000_000_000;

    with_open_tasks_iter(|iter| {
        for (task_id, task) in iter {
            let task_id_copy = task_id.clone();

            if let Ok(expired) = close_task_if_expired(task_id_copy.clone()) {
                if expired {
                    continue;
                }
            }

            let end_time = task.end_time();
            let delay_sec = end_time.saturating_sub(now_sec);
            let timer_id = set_timer(Duration::from_secs(delay_sec), {
                let id = task_id_copy.clone();
                move || {
                    let _ = close_task(id);
                }
            });

            let _ = mut_open_task(task_id_copy, |maybe_task| {
                if let Some(t) = maybe_task.as_mut() {
                    t.set_timer_id(timer_id.into());
                }
                Ok::<(), crate::errors::Error>(())
            });
        }
    });
}

pub fn close_task(task_id: TaskId) -> Result<(), Error> {
    let task = remove_open_task(&task_id)?;
    if let Some(timer_key_data) = task.timer_id() {
        match TimerId::try_from(timer_key_data.clone()) {
            Ok(timer_id) => ic_cdk_timers::clear_timer(timer_id),
            Err(e) => return Err(e),
        }
    }
    let closed_task: ClosedTask = task.into();
    
    insert_closed_task(task_id, closed_task)?;
    Ok(())
}

pub fn close_task_if_expired(task_id: TaskId) -> Result<bool, Error> {
    let task = get_open_task(&task_id).ok_or(Error::TaskNotFound(task_id))?;

    if task.is_expired() {
        close_task(task_id)?;
        Ok(true)
    } else {
        Ok(false)
    }
}