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
use crate::state::State;
use crate::task::submission::Submission;
use crate::task::CreateTaskArgs;
use crate::task::TaskId;

use candid::Nat;
use candid::Principal;
use shared::SpaceArgs;

ic_cdk::export_candid!();
