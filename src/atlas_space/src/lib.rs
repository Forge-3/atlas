mod config;
mod cycles;
mod errors;
mod guard;
mod lifecycle;
mod memory;
mod methods;
mod state;

use crate::cycles::WalletReceiveResult;
use crate::errors::Error;
use crate::state::State;
use candid::Nat;
use shared::SpaceArgs;

ic_cdk::export_candid!();
