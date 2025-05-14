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
    pub admin: Principal,
    pub space_name: String,
    pub space_description: String,
    pub space_symbol: Option<String>,
    pub space_logo: Option<String>,
    pub space_background: Option<String>,
    pub ckusdc_ledger: CkUsdcLedger,
}

#[derive(Deserialize, CandidType)]
pub enum SpaceArgs {
    InitArg(SpaceInitArg),
    UpgradeArg,
}
