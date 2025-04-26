use std::borrow::Cow;

use candid::{CandidType, Encode, Principal};
use ic_cdk::api::management_canister::main::{
    canister_info, create_canister, install_code, CanisterInfoRequest, CanisterSettings,
    CreateCanisterArgument, InstallCodeArgument,
};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor;
use shared::{SpaceArgs, SpaceInitArg};

use crate::errors::Error;

pub const SPACE_WASM: &[u8] =
    std::include_bytes!("../../../target/wasm32-unknown-unknown/release/atlas_space-opt.wasm.gz");
pub const SPACE_DEFAULT_CYCLES: u128 = 10_000_000_000_000;

#[derive(Debug, CandidType, minicbor::Decode, minicbor::Encode)]
pub struct Space {
    #[cbor(n(0), with = "crate::cbor::principal")]
    id: Principal,
}

impl Space {
    pub fn new(id: Principal) -> Self {
        Self { id }
    }

    pub async fn create_space(arg: SpaceInitArg) -> Result<Self, Error> {
        let mut archive_controllers = vec![ic_cdk::id()];
        let (info,) = canister_info(CanisterInfoRequest {
            canister_id: ic_cdk::id(),
            num_requested_changes: None,
        })
        .await
        .map_err(|err| Error::FailedToGetCanisterInfo(format!("{:?}", err)))?;

        if !info.controllers.is_empty() {
            archive_controllers.extend(info.controllers);
        }
        let init_arg = Encode!(&SpaceArgs::InitArg(arg)).unwrap();

        let (principal,) = create_canister(
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
        .await
        .map_err(|err| Error::FailedToInitializeCanister(format!("{:?}", err)))?;

        install_code(InstallCodeArgument {
            mode: ic_cdk::api::management_canister::main::CanisterInstallMode::Install,
            canister_id: principal.canister_id,
            wasm_module: SPACE_WASM.to_vec(),
            arg: init_arg,
        })
        .await
        .map_err(|err| Error::FailedToInstallWASM(format!("{:?}", err)))?;

        Ok(Space::new(principal.canister_id))
    }

    pub fn principal(&self) -> Principal {
        self.id
    }
}

impl Storable for Space {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("User encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode User bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: Principal::MAX_LENGTH_IN_BYTES as u32,
        is_fixed_size: false,
    };
}
