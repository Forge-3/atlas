mod config;
mod cycles;
mod errors;
mod funds;
mod guard;
mod lifecycle;
mod memory;
mod methods;
mod migration;
mod nat256;
mod state;
mod tasks;
mod update_helpers;

use crate::config::Config;
use crate::cycles::WalletReceiveResult;
use crate::errors::Error;
use crate::methods::query::{GetClosedTasksRes, GetTasksArgs, GetTasksRes, SpaceInfo};
use crate::state::{EditSpaceArgs, State};
use crate::tasks::{
    submission::Submission,
    task::{CreateTaskArgs, EditTaskArgs, TwitterTaskType},
    task_types::TaskId,
};

use candid::{Nat, Principal};
use shared::SpaceArgs;

ic_cdk::export_candid!();
