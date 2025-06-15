use candid::CandidType;
use ic_cdk::{init, post_upgrade, pre_upgrade};
use serde::Deserialize;
use shared::SpaceArgs;

use crate::{
    config::{Config, UpdateConfig}, guard::authenticated_guard, memory, space::SPACE_WASM, user::{Rank, User}
};

#[derive(Deserialize, CandidType)]
pub enum AtlasArgs {
    InitArg(Config),
    UpgradeArg{
        config: Option<UpdateConfig>,
        upgrade_space_arg: Option<SpaceArgs>
    },
}

#[init]
pub fn init(args: AtlasArgs) {
    match args {
        AtlasArgs::InitArg(init_arg) => memory::set_config(init_arg).unwrap(),
        AtlasArgs::UpgradeArg { config: _, upgrade_space_arg: _ } => ic_cdk::trap("cannot init canister state with upgrade args"),
    }

    let caller = authenticated_guard().unwrap();
    memory::insert_user(caller, User::new(Rank::Admin));
}

#[pre_upgrade]
fn pre_upgrade() {
    crate::space::archive_space_version();
}


#[post_upgrade]
async fn post_upgrade(minter_arg: AtlasArgs) {
    match minter_arg {
        AtlasArgs::InitArg(_) => {
            ic_cdk::trap("cannot upgrade canister state with init args");
        }
        AtlasArgs::UpgradeArg { config, upgrade_space_arg: _ } => {
            if let Some(config) = config {
                memory::mut_config(|maybe_config| {
                    if let Some(old_config) = maybe_config {
                        old_config.update_config(config);
                    }
                });
            }
            //management::upgrade_spaces(upgrade_space_arg).await;
        },
    }
}