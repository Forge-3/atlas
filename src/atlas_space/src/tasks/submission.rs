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
    #[n(1)]
    Empty,
    #[n(2)]
    List {
        #[n(0)]
        items: Vec<String>,
    },
    #[n(3)]
    Discord {
        #[n(0)]
        username: String,
        #[n(1)]
        user_id: u64,
    },
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

    pub fn clear_content(&mut self) {
        self.submission = Submission::Empty;
    }
}
