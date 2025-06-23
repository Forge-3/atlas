mod config;
mod cycles;
mod errors;
mod funds;
mod guard;
mod lifecycle;
mod memory;
mod methods;
mod nat256;
mod state;
mod task;

use crate::cycles::WalletReceiveResult;
use crate::errors::Error;
use crate::methods::query::{GetTasksArgs, GetTasksRes};
use crate::state::{State, EditSpaceArgs};
use crate::task::{submission::Submission, CreateTaskArgs, TaskId};

use candid::{Principal, Nat};
use shared::SpaceArgs;

ic_cdk::export_candid!();
