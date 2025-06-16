use candid::CandidType;
use serde::Deserialize;
use thiserror::Error;

use crate::task::TaskId;

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

    #[error("Caller is not an parent")]
    NotParent,

    #[error("Caller is not an admin, owner, parent")]
    NotAdminNorOwnerNorParent,

    #[error("Task already exists ({0})")]
    TaskAlreadyExists(TaskId),

    #[error("Failed to transfer funds (Error: {0})")]
    FailedToTransfer(String),

    #[error("Invalid task content (Error: {0})")]
    InvalidTaskContent(String),

    #[error("Count is to high (max: {max}, found: {found})")]
    CountToHigh { max: usize, found: usize },

    #[error("Task do not exists ({0})")]
    TaskDoNotExists(TaskId),

    #[error("Subtask do not exists ({0})")]
    SubtaskDoNotExists(usize),

    #[error("User already submitted submission")]
    UserAlreadySubmitted,

    #[error("User submission not found")]
    UserSubmissionNotFound,

    #[error("Incorrect type of submission (expected: {0})")]
    IncorrectSubmission(String),

    #[error("Space bytecode is up to date")]
    BytecodeUpToDate,

    #[error("Failed to call main app (Error: {0})")]
    FailedToCallMain(String),

    #[error("User does not belong to space")]
    UserDoesNotBelongToSpace,

    #[error("Submission is not accepted")]
    SubmissionNotAccepted,

    #[error("Usage limit exceeded")]
    UsageLimitExceeded,

    #[error("User already rewarded")]
    UserAlreadyRewarded,
}
