use std::{borrow::Cow, fmt};

use candid::{CandidType, Encode, Principal};
use ic_cdk::api::management_canister::main::{
    canister_info, create_canister, install_code, CanisterInfoRequest, CanisterSettings,
    CreateCanisterArgument, InstallCodeArgument,
};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor;
use serde::Deserialize;
use sha2::Digest;
use shared::{SpaceArgs, SpaceInitArg};

use crate::{errors::Error, memory};

pub const SPACE_WASM: &[u8] =
    std::include_bytes!("../../../target/wasm32-unknown-unknown/release/atlas_space-opt.wasm.gz");
pub const SPACE_DEFAULT_CYCLES: u128 = 10_000_000_000_000;

#[derive(
    Debug, CandidType, minicbor::Decode, minicbor::Encode, Deserialize, Clone, Eq, PartialEq, Default
)]
pub enum SpaceType {
    #[default]
    #[n(0)]
    HUB
}

#[derive(
    Debug, CandidType, minicbor::Decode, minicbor::Encode, Deserialize, Clone, Eq, PartialEq,
)]
pub struct Space {
    #[cbor(n(0), with = "shared::cbor::principal")]
    id: Principal,
    #[n(1)]
    space_type: SpaceType
}

impl fmt::Display for Space {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.id)
    }
}

impl Space {
    pub fn new(id: Principal, space_type: SpaceType) -> Self {
        Self { id, space_type }
    }

    pub fn space_type(&self) -> SpaceType {
        self.space_type.clone()
    }

    pub async fn create_space(arg: SpaceInitArg, space_type: SpaceType) -> Result<Self, Error> {
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
        let init_arg =
            Encode!(&SpaceArgs::InitArg(Box::new(arg))).expect("Failed to encode init args?!");

        let (principal,) = create_canister(
            CreateCanisterArgument {
                settings: Some(CanisterSettings {
                    controllers: Some(archive_controllers.clone()),
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

        Ok(Space::new(principal.canister_id, space_type))
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

#[inline]
pub fn archive_space_version() {
    let current_space_version = memory::read_config(|config| config.current_space_version);
    let last_space_bytecode =
        memory::get_bytecode_by_version(&current_space_version.checked_sub(1).unwrap_or_default());
    if let Some(last_space_bytecode) = last_space_bytecode {
        let old_sha256sum = sha2::Sha256::digest(last_space_bytecode.as_slice());
        let current_sha256sum = sha2::Sha256::digest(SPACE_WASM);

        if old_sha256sum == current_sha256sum {
            ic_cdk::println!("Current WASM is eq to last WASM version ({current_space_version})");
            return;
        }
    }

    ic_cdk::println!("New WASM version was archived as a version {current_space_version}");
    memory::insert_new_version(current_space_version, SPACE_WASM.to_vec());
    memory::mut_config(|config| {
        if let Some(config) = config {
            config.current_space_version = config
                .current_space_version
                .checked_add(1)
                .expect("Version out of range?!")
        }
    });
}

#[inline]
pub fn get_space_bytecode_by_version(version: u64) -> Option<Vec<u8>> {
    let current_space_version = memory::read_config(|config| config.current_space_version);

    if version == current_space_version {
        Some(SPACE_WASM.to_vec())
    } else {
        memory::get_bytecode_by_version(&version)
    }
}
