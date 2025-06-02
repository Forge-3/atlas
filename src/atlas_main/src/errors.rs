use candid::{CandidType, Principal};
use serde::Deserialize;
use thiserror::Error;

use crate::{space::Space, user::Rank};

#[derive(Clone, PartialEq, Debug, CandidType, Deserialize, Error)]
pub enum Error {
    #[error("Anonymous principal is not allowed")]
    AnonymousCaller,

    #[error("Failed to update config (reason: {0})")]
    FailedToUpdateConfig(String),

    #[error("User rank is to high (expected: {expected:?}, found: {found:?})")]
    UserRankToHigh { expected: Rank, found: Rank },

    #[error("User already have this rank ({0})")]
    UserAlreadyHaveExpectedRank(Rank),

    #[error("User rank do not match (expected: {0:?})")]
    UserRankNoMatch(Vec<Rank>),

    #[error("User rich space limit (expected: {expected:?}, found: {found:?})")]
    UserRichSpaceLimit { expected: usize, found: usize },

    #[error("Failed to initialize canister (Error: {0})")]
    FailedToInitializeCanister(String),

    #[error("Failed to update canister settings (Error: {0})")]
    FailedToUpdateCanisterSettings(String),

    #[error("Failed to install wasm (Error: {0})")]
    FailedToInstallWASM(String),

    #[error("Failed to get canister info (Error: {0})")]
    FailedToGetCanisterInfo(String),

    #[error("Failed to push new space to stable vec (Error: {0})")]
    FailedToSaveSpace(String),

    #[error("User do not exist")]
    UserDoNotExist,

    #[error("Count is to high (max: {max}, found: {found})")]
    CountToHigh { max: usize, found: usize },

    #[error("Space creation in progress")]
    CreationInProgress,

    #[error("Space do not exist")]
    SpaceNotExist,

    #[error("Failed to call space {principal} ({err})")]
    FailedToCallSpace { principal: Principal, err: String },

    #[error("User rank is to low (expected: {expected:?} or above, found: {found:?})")]
    UserRankToLow { expected: Rank, found: Rank },

    #[error("User is not an owner of the space {0}")]
    UserNotAnOwner(Space),

    #[error("User already is hub member")]
    UserAlreadyIsHubMember,
}
