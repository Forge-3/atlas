mod config;
mod cycles;
mod errors;
mod guard;
mod lifecycle;
mod memory;
mod methods;
mod state;
mod task;
mod nat256;
mod deposit;

use crate::cycles::WalletReceiveResult;
use crate::errors::Error;
use crate::state::State;
use crate::methods::update::CreateTaskArgs;
use candid::Nat;
use shared::SpaceArgs;

ic_cdk::export_candid!();
