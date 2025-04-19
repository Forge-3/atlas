mod cycles;
mod errors;
mod guard;
mod methods;
mod lifecycle;
mod config;
mod cbor;
mod memory;
mod state;

use candid::Nat;
use crate::errors::Error;
use crate::cycles::WalletReceiveResult;
use crate::lifecycle::SpaceArgs;

ic_cdk::export_candid!();
