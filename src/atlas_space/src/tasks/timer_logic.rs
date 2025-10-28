use crate::errors::Error;
use crate::memory;
use crate::tasks::closed_task::ClosedTask;
use crate::tasks::task::Task;
use crate::tasks::task_types::TaskId;
use ic_cdk_timers::set_timer;
use ic_cdk_timers::TimerId;
use ic_stable_structures::Storable;
use sha2::Digest;
use std::time::Duration;

pub async fn reinitialize_task_timers_after_upgrade() {
    ic_cdk::println!("Reinitialize timers for tasks");

    let now_sec = now_in_seconds();
    let tasks: Vec<(TaskId, Task)> = memory::with_open_tasks_iter(|iter| {
        iter.map(|(task_id, task)| (task_id, task.clone()))
            .collect()
    });

    for (task_id, task) in tasks {
        if let Ok(expired) = expire_task_if_expired(task_id).await {
            if expired {
                continue;
            }
        }

        let end_time = task.end_time;
        let delay_sec = end_time.saturating_sub(now_sec);
        let timer_id = set_timer(Duration::from_secs(delay_sec), {
            let id = task_id;
            move || {
                ic_cdk::futures::spawn(async move {
                    force_expire_task(id).await.unwrap();
                });
            }
        });

        if let Err(e) = memory::mut_open_task(task_id, |maybe_task| {
            if let Some(t) = maybe_task.as_mut() {
                t.timer_id = Some(timer_id.into());
            }
            Ok::<(), Error>(())
        }) {
            ic_cdk::println!("Failed to update task {:?}: {:?}", task_id, e);
        }
    }
}

pub fn schedule_expire_task_timer(task_id: TaskId, end_time_sec: u64) -> TimerId {
    let delay_sec = end_time_sec.saturating_sub(now_in_seconds());

    set_timer(Duration::from_secs(delay_sec), {
        let id = task_id;
        move || {
            ic_cdk::futures::spawn(async move {
                force_expire_task(id).await.unwrap();
            });
        }
    })
}

pub async fn expire_task_if_expired(task_id: TaskId) -> Result<bool, Error> {
    let task = memory::get_open_task(&task_id).ok_or(Error::TaskNotFound(task_id))?;
    let is_expired = task.is_expired();
    if is_expired {
        force_expire_task(task_id).await?;
    }

    Ok(is_expired)
}

pub async fn force_expire_task(task_id: TaskId) -> Result<(), Error> {
    let task = memory::get_open_task(&task_id).ok_or(Error::TaskNotFound(task_id))?;
    let timer_id = task.timer_id.clone();
    if let Some(timer_key_data) = timer_id {
        ic_cdk_timers::clear_timer(
            TimerId::try_from(timer_key_data.clone()).expect("Invalid TimerId?!"),
        );
    }

    memory::remove_open_task(&task_id).unwrap();
    memory::insert_expired_task(task_id, task).unwrap();
    Ok(())
}

pub async fn force_close_task(task_id: TaskId) -> Result<(), Error> {
    let task = memory::get_expired_task(&task_id).ok_or(Error::TaskNotFound(task_id))?;
    let mut closed_task: ClosedTask = task.into();
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
    closed_task.claim_remains(subaccount).await?;

    memory::remove_expired_task(&task_id).unwrap();
    memory::insert_closed_task(task_id, closed_task).unwrap();
    Ok(())
}

pub fn now_in_seconds() -> u64 {
    ic_cdk::api::time() / 1_000_000_000 // nanoseconds to seconds
}
