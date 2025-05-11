use candid::CandidType;
use serde::Deserialize;
use thiserror::Error;

use crate::user::Rank;

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

    #[error("User rank do not match (expected: {0})")]
    UserRankNoMatch(Rank),

    #[error("User rich space limit (expected: {expected:?}, found: {found:?})")]
    UserRichSpaceLimit { expected: usize, found: usize },

    #[error("Failed to initialize canister (Err: {0})")]
    FailedToInitializeCanister(String),

    #[error("Failed to install wasm (Err: {0})")]
    FailedToInstallWASM(String),

    #[error("Failed to get canister info (Err: {0})")]
    FailedToGetCanisterInfo(String),

    #[error("Failed to push new space to stable vec (Err: {0})")]
    FailedToSaveSpace(String),

    #[error("User do not exist")]
    UserDoNotExist,

    #[error("Count is to high (max: {max}, found: {found})")]
    CountToHigh { max: usize, found: usize },

    #[error("Space creation in progress")]
    CreationInProgress
}
