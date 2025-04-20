use candid::Principal;
use ic_cdk::api::management_canister::main::{create_canister, install_code, CanisterSettings, CreateCanisterArgument, InstallCodeArgument};
use shared::{InitArg, SpaceArgs};

use crate::errors::Error;

pub const SPACE_WASM: &[u8] =
    std::include_bytes!("../../../target/wasm32-unknown-unknown/release/atlas_space-opt.wasm.gz");
pub const SPACE_DEFAULT_CYCLES: u128 = 10_000_000_000_000;

pub struct Space(Principal);

impl Space {
    pub async fn create_space(arg: InitArg) {
        let mut archive_controllers = vec![ic_cdk::id()];

        if let Some(Some(controllers)) = arg.controllers {
            if !controllers.is_empty() {
                archive_controllers.extend(controllers);
            }
        }
     
        let principal = create_canister(
            CreateCanisterArgument {
                settings: Some(CanisterSettings {
                    controllers: Some(archive_controllers),
                    compute_allocation: None,
                    memory_allocation: None,
                    freezing_threshold: None,
                    reserved_cycles_limit: None,
                    log_visibility: None,
                    wasm_memory_limit: None,
                }),
            },
            SPACE_DEFAULT_CYCLES,
        )
        .await.map_err(|err|  Error::FailedToInitializeCanister(format!("{:?}", err)))?;

        install_code(
           // SpaceArgs::InitArg(arg)
           InstallCodeArgument {
            mode: ic_cdk::api::management_canister::main::CanisterInstallMode::Install,
            canister_id: principal,
            wasm_module: ARCHIVE_WASM.to_vec(),
            arg: init_arg,
        }
        );

    }
}
