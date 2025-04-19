use candid::CandidType;
use serde::Deserialize;
use thiserror::Error;

#[derive(Clone, PartialEq, Debug, CandidType, Deserialize, Error)]
pub enum Error {
    #[error("Anonymous principal is not allowed")]
    AnonymousCaller,

    #[error("Failed to update config (reason: {0})")]
    FailedToUpdateConfig(String),

    #[error("Config is not set")]
    ConfigNotSet,

    #[error("Caller is not an owner")]
    NotOwner,

    #[error("Caller is not an admin")]
    NotAdmin,

    #[error("Caller is not an admin nor Owner")]
    NotAdminNorOwner,
}
