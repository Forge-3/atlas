use ic_cdk::{init, post_upgrade};
use shared::SpaceArgs;

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

#[post_upgrade]
fn post_upgrade(minter_arg: Option<SpaceArgs>) {
    if let Some(SpaceArgs::InitArg(_)) = minter_arg {
        ic_cdk::trap("cannot upgrade canister state with init args");
    }
}