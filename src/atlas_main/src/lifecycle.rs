use candid::CandidType;
use ic_cdk::init;
use serde::Deserialize;

use crate::{config::Config, guard::authenticated_guard, memory, user::{Rank, User}};

#[derive(Deserialize, CandidType)]
pub enum AtlasArgs {
    InitArg(Config),
    UpgradeArg(Config),
}

#[init]
pub fn init(args: AtlasArgs) {
    match args {
        AtlasArgs::InitArg(init_arg) => memory::set_config(init_arg).unwrap(),
        AtlasArgs::UpgradeArg(_) => ic_cdk::trap("cannot init canister state with upgrade args"),
    }

    let caller = authenticated_guard().unwrap();
    memory::insert_user(caller, User::new(Rank::Admin));
}