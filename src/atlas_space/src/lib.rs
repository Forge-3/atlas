mod config;
mod cycles;
mod deposit;
mod errors;
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
use crate::task::CreateTaskArgs;
use crate::state::State;
use crate::task::TaskId;
use crate::task::submission::Submission;

use candid::Nat;
use shared::SpaceArgs;

ic_cdk::export_candid!();
