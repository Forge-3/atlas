use candid::{Encode, Principal};
use futures::future::join_all;
use ic_cdk::api::management_canister::main::{CanisterInstallMode, InstallCodeArgument};
use shared::SpaceArgs;

use crate::{
    memory,
    space::{Space, SPACE_WASM},
};

pub async fn upgrade_spaces(space: Space, version: u64, upgrade_space_arg: Option<SpaceArgs>) {
    ic_cdk::println!("Preparation for upgrade of spaces {}", space.principal());

    let bytecode = memory::get_bytecode_by_version(&version)
        .expect("Failed to get given version of bytecode?!");
    let args = InstallCodeArgument {
        mode: CanisterInstallMode::Upgrade(None),
        canister_id: space.principal(),
        wasm_module: bytecode,
        arg: Encode!(&upgrade_space_arg).unwrap(),
    };
    ic_cdk::api::management_canister::main::install_code(args)
        .await
        .unwrap();

    ic_cdk::println!("Successfully upgraded {}", space.principal());
}
