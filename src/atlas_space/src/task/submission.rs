use candid::CandidType;
use minicbor::{Decode, Encode};
use serde::Deserialize;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType, Default)]
pub enum SubmissionState {
    #[default]
    #[n(0)]
    WaitingForReview,

    #[n(1)]
    Accepted,

    #[n(2)]
    Rejected,
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType, Deserialize)]
pub enum Submission {
    #[n(0)]
    Text {
        #[n(0)]
        content: String,
    },
}

impl Submission {
    pub fn is_text(&self) -> bool {
        matches!(self, Submission::Text { .. })
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct SubmissionData {
    #[n(0)]
    pub(crate) submission: Submission,

    #[n(1)]
    pub(crate) state: SubmissionState,

    #[n(2)]
    pub(crate) rejection_reason: Option<String>,
}

impl SubmissionData {
    pub fn new(submission: Submission, state: SubmissionState) -> Self {
        Self {
            submission,
            state,
            rejection_reason: None,
        }
    }
    pub fn set_rejection_reason(&mut self, reason: Option<String>) {
        self.rejection_reason = reason;
    }

    pub fn set_state(&mut self, state: SubmissionState) {
        self.state = state
    }

    pub fn get_state(&self) -> &SubmissionState {
        &self.state
    }
}
