use candid::Encode;
use ic_cdk::management_canister::{install_code, CanisterInstallMode, InstallCodeArgs};
use shared::SpaceArgs;

use crate::{memory, space::Space};

pub async fn upgrade_spaces(space: Space, version: u64, upgrade_space_arg: Option<SpaceArgs>) {
    ic_cdk::println!("Preparation for upgrade of spaces {}", space.principal());

    let bytecode = memory::get_bytecode_by_version(&version)
        .expect("Failed to get given version of bytecode?!");

    install_code(&InstallCodeArgs {
        mode: CanisterInstallMode::Upgrade(None),
        canister_id: space.principal(),
        wasm_module: bytecode,
        arg: Encode!(&upgrade_space_arg).unwrap(),
    })
    .await
    .unwrap();

    ic_cdk::println!("Successfully upgraded {}", space.principal());
}
