use ic_cdk::init;
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

