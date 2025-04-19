use candid::{CandidType, Principal};
use ic_cdk::init;
use serde::Deserialize;

use crate::{config::Config, guard::authenticated_guard, memory};

#[init]
pub fn init(args: SpaceArgs) {
    let caller = authenticated_guard().unwrap();
    
    if let SpaceArgs::InitArg(init_arg) = args {
        memory::set_config(Config::new(caller, init_arg.clone())).unwrap();
        memory::set_state(init_arg.into()).unwrap();
        return;
    }
    ic_cdk::trap("Cannot init canister state with upgrade args");
}

#[derive(Deserialize, CandidType, Clone)]
pub struct InitArg {
    pub admin: Principal,
    pub space_name: String,
    pub space_description: String,
    pub space_logo: Option<String>,
    pub space_background: Option<String>,
}

#[derive(Deserialize, CandidType)]
pub enum SpaceArgs {
    InitArg(InitArg),
    UpgradeArg(Config),
}
