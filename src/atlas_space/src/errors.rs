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

    #[error("Caller is not an admin nor Owner")]
    NotAdminNorOwner,

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

    #[error("Incorrect type of submission (expected: {0})")]
    IncorrectSubmission(String),

    #[error("Space bytecode is up to date")]
    BytecodeUpToDate,

    #[error("Failed to call main app (Error: {0})")]
    FailedToCallMain(String),
}
