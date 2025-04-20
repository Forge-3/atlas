use candid::{Principal, CandidType};
use serde::Deserialize;


#[derive(Deserialize, CandidType, Clone)]
pub struct InitArg {
    pub admin: Principal,
    pub space_name: String,
    pub space_description: String,
    pub space_logo: Option<String>,
    pub space_background: Option<String>,
}

#[derive(Deserialize, CandidType)]
pub enum SpaceArgs {
    InitArg(InitArg),
    UpgradeArg,
}
