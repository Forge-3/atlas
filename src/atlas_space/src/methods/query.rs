use std::collections::BTreeMap;

use candid::CandidType;
use ic_cdk::query;
use serde::Deserialize;

use crate::{
    errors::Error,
    memory,
    state::State,
    task::{Task, TaskId, ClosedTask},
};

const MAX_TASKS_PER_RESPONSE: u8 = 200;

#[query]
pub fn get_state() -> State {
    memory::read_state(|state| state.clone())
}

#[derive(Debug, CandidType, Deserialize)]
pub struct GetTasksArgs {
    start: usize,
    count: usize,
}

#[derive(Debug, CandidType)]
pub struct GetTasksRes {
    pub tasks_count: usize,
    pub tasks: BTreeMap<TaskId, Task>,
}

#[derive(Debug, CandidType)]
pub struct GetClosedTasksRes {
    pub tasks_count: usize,
    pub tasks: BTreeMap<TaskId, ClosedTask>,
}

#[query]
pub fn get_open_tasks(args: GetTasksArgs) -> Result<GetTasksRes, Error> {
    if args.count > MAX_TASKS_PER_RESPONSE as usize {
        return Err(Error::CountToHigh {
            max: MAX_TASKS_PER_RESPONSE as usize,
            found: args.count,
        });
    }

    let tasks = memory::with_open_tasks_iter(|tasks| {
        tasks
            .skip(args.start)
            .take(args.count.min(MAX_TASKS_PER_RESPONSE as usize))
            .collect()
    });

    Ok(GetTasksRes {
        tasks,
        tasks_count: memory::get_open_tasks_len() as usize,
    })
}

#[query]
pub fn get_closed_tasks(args: GetTasksArgs) -> Result<GetClosedTasksRes, Error> {
    if args.count > MAX_TASKS_PER_RESPONSE as usize {
        return Err(Error::CountToHigh {
            max: MAX_TASKS_PER_RESPONSE as usize,
            found: args.count,
        });
    }

    let tasks = memory::with_closed_tasks_iter(|tasks| {
        tasks
            .skip(args.start)
            .take(args.count.min(MAX_TASKS_PER_RESPONSE as usize))
            .collect()
    });

    Ok(GetClosedTasksRes {
        tasks,
        tasks_count: memory::get_closed_tasks_len() as usize,
    })
}

#[query]
pub fn get_current_bytecode_version() -> u64 {
    memory::read_config(|config| config.current_wasm_version)
}
