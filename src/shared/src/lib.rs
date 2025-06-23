use std::collections::BTreeMap;

use candid::{CandidType, Nat, Principal};
use serde::Deserialize;

pub mod cbor;

#[derive(Deserialize, CandidType, Clone)]
pub struct CkUsdcLedger {
    pub principal: Principal,
    pub fee: Option<Nat>,
}

#[derive(Deserialize, CandidType, Clone)]
pub struct SpaceInitArg {
    pub owner: Principal,
    pub space_name: String,
    pub space_description: String,
    pub space_symbol: Option<String>,
    pub space_logo: Option<String>,
    pub space_background: Option<String>,
    pub ckusdc_ledger: CkUsdcLedger,
    pub current_wasm_version: u64,
    pub external_links: BTreeMap<String, String>
}

#[derive(Deserialize, CandidType, Clone)]
pub enum SpaceArgs {
    InitArg(Box<SpaceInitArg>),
    UpgradeArg { version: u64 },
}
