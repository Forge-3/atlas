use std::{borrow::Cow, collections::BTreeMap, fmt};

use candid::{CandidType, Nat, Principal};
use ic_cdk::update;
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use serde::Deserialize;
use sha2::Digest;
use submission::{Submission, SubmissionData, SubmissionState};
use token_reward::TokenReward;
use ic_cdk::api::management_canister::http_request::{ CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse};
use serde_json;

use crate::errors::Error;

pub mod submission;
pub mod token_reward;
pub mod xp_reward;

#[derive(CandidType, Deserialize)]
pub struct CreateTaskArgs {
    pub task_title: String,
    pub token_reward: TokenReward,
    pub subtasks: Vec<CreateSubTaskArgs>,
    pub number_of_uses: u64,
}
#[derive(CandidType, Deserialize)]
pub struct CreateSubTaskArgs {
    pub kind: String,
    pub content: TaskContent,
}
#[derive(Debug, serde::Deserialize)]
struct DiscordGuild {
    id: String,
    name: String,
}

impl CreateTaskArgs {
    pub fn validate(&self) -> Result<(), Error> {
        if self.task_title.trim().len() > 50 {
            return Err(Error::InvalidTaskContent(
                "Task title is too long (max length: 50)".into(),
            ));
        }
        if self.subtasks.len() > 10 {
            return Err(Error::InvalidTaskContent("Too many subtasks".into()));
        }
        self.subtasks
            .iter()
            .try_for_each(|sub| sub.content.validate())
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType, Deserialize)]
pub enum TaskContent {
    #[n(0)]
    TitleAndDescription {
        #[n(0)]
        task_title: String,
        #[n(1)]
        task_description: String,

    },
}

impl TaskContent {
    pub fn validate(&self) -> Result<(), Error> {
        match self {
            TaskContent::TitleAndDescription {
                task_title,
                task_description,
            } => {
                if task_title.trim().len() > 50 {
                    return Err(Error::InvalidTaskContent(
                        "Subtask title is too long (max length: 50)".into(),
                    ));
                }
                if task_description.trim().len() > 500 {
                    return Err(Error::InvalidTaskContent(
                        "Subtask description is too long (max length: 500)".into(),
                    ));
                }
                Ok(())
            }
        }
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub enum TaskType {
    #[n(0)]
    GenericTask {
        #[n(0)]
        task_content: TaskContent,
        #[cbor(n(1), with = "shared::cbor::principal::b_tree_map")]
        submission: BTreeMap<Principal, SubmissionData>,
    },
    #[n(1)]
    DiscordTask {
        #[n(0)]
        task_content: TaskContent,
        #[cbor(n(1), with = "shared::cbor::principal::b_tree_map")]
        submission: BTreeMap<Principal, SubmissionData>,
    }
}

impl TaskType {
    pub fn submit(&mut self, user: Principal, submission: Submission) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                task_content: _,
                submission: submissions_map,
            } => {
                if submissions_map.contains_key(&user) {
                    return Err(Error::UserAlreadySubmitted);
                }
                if !submission.is_text() {
                    return Err(Error::IncorrectSubmission("Text".to_string()));
                }
                match &submission {
                    Submission::Text { content } => content.trim().len(),
                };

                submissions_map.insert(
                    user,
                    SubmissionData::new(submission, SubmissionState::default()),
                );
                Ok(())
            }
            TaskType::DiscordTask { task_content: _, submission: submission_map } => {
                if submission_map.contains_key(&user) {
                    return Err(Error::UserAlreadySubmitted);
                }
                if !submission.is_text() {
                    return Err(Error::IncorrectSubmission("Text".to_string()));
                }
                match &submission {
                    Submission::Text { content } => content.trim().len(),
                };

                submission_map.insert(
                    user,
                    SubmissionData::new(submission, SubmissionState::default()),
                );
                Ok(())
            }
        }
    }
    pub fn accept(&mut self, user: Principal) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                        task_content: _,
                        submission: submissions_map,
                    } => {
                        let submission = submissions_map
                            .get_mut(&user)
                            .ok_or(Error::UserSubmissionNotFound)?;
                        submission.set_state(SubmissionState::Accepted);
                    }
            TaskType::DiscordTask { task_content, submission } => todo!(),
        }

        Ok(())
    }
    pub fn reject(&mut self, user: Principal) -> Result<(), Error> {
        match self {
            TaskType::GenericTask {
                        task_content: _,
                        submission: submissions_map,
                    } => {
                        let submission = submissions_map
                            .get_mut(&user)
                            .ok_or(Error::UserSubmissionNotFound)?;
                        submission.set_state(SubmissionState::Rejected);
                    }
            TaskType::DiscordTask { task_content, submission } => todo!(),
        }

        Ok(())
    }

    pub fn get_submission(&self, user: Principal) -> Result<&SubmissionData, Error> {
        match self {
            TaskType::GenericTask {
                        task_content: _,
                        submission: submissions_map,
                    } => Ok(submissions_map
                        .get(&user)
                        .ok_or(Error::UserSubmissionNotFound)?),
            TaskType::DiscordTask { task_content, submission } => todo!(),
        }
    }
}

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct Task {
    #[cbor(n(0), with = "shared::cbor::principal")]
    creator: Principal,
    #[n(1)]
    token_reward: TokenReward,
    #[n(2)]
    tasks: Vec<TaskType>,
    #[n(3)]
    number_of_uses: u64,
    #[n(4)]
    task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    rewarded: Vec<Principal>,
}

impl Task {
    pub async fn new(
        creator: Principal,
        create_task_args: CreateTaskArgs,
        subaccount: [u8; 32],
    ) -> Result<Self, Error> {
        create_task_args
            .token_reward
            .deposit_reward(creator, subaccount, create_task_args.number_of_uses)
            .await?;

        Ok(Self {
            creator,
            token_reward: create_task_args.token_reward,
            tasks: create_task_args
                .subtasks
                .iter()
                .map(|sub| match sub.kind.as_str() {
                    "discord" => TaskType::DiscordTask {
                        task_content: sub.content.clone(),
                        submission: Default::default(),
                    },
                    _ => TaskType::GenericTask {
                        task_content: sub.content.clone(),
                        submission: Default::default(),
                    }
                })
                .collect(),
            number_of_uses: create_task_args.number_of_uses,
            task_title: create_task_args.task_title,
            rewarded: Vec::new(),
        })
    }

    pub fn submit_subtask_submission(
        &mut self,
        user: Principal,
        subtask_id: usize,
        submission: Submission,
    ) -> Result<(), Error> {
        let subtask = self
            .tasks
            .get_mut(subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;
        subtask.submit(user, submission)?;

        Ok(())
    }

    pub fn accept_subtask_submission(
        &mut self,
        user: Principal,
        subtask_id: usize,
    ) -> Result<(), Error> {
        let subtask = self
            .tasks
            .get_mut(subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;
        subtask.accept(user)?;

        Ok(())
    }

    pub fn reject_subtask_submission(
        &mut self,
        user: Principal,
        subtask_id: usize,
    ) -> Result<(), Error> {
        let subtask = self
            .tasks
            .get_mut(subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;
        subtask.reject(user)?;

        Ok(())
    }

    pub async fn claim_reward(
        &mut self,
        user: Principal,
        subaccount: [u8; 32],
    ) -> Result<(), Error> {
        let subtask = self.tasks.iter().all(|task| {
            let state = task.get_submission(user).unwrap().get_state();
            state == &SubmissionState::Accepted
        });
        if !subtask {
            return Err(Error::SubmissionNotAccepted);
        }
        if Nat::from(self.rewarded.len()) >= self.number_of_uses {
            return Err(Error::UsageLimitExceeded);
        }
        if self.rewarded.contains(&user) {
            return Err(Error::UserAlreadyRewarded);
        }
        self.token_reward.withdraw_reward(user, subaccount).await?;
        self.rewarded.push(user);
        Ok(())
    }
}

impl Storable for Task {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("User encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode User bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(
    Eq, PartialEq, Debug, Decode, Encode, Clone, PartialOrd, Ord, CandidType, Deserialize, Copy,
)]
pub struct TaskId(#[n(0)] u64);

impl fmt::Display for TaskId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "TaskId: {}", self.0)
    }
}

impl TaskId {
    pub fn new(id: u64) -> Self {
        Self(id)
    }

    pub fn u64(&self) -> u64 {
        self.0
    }
}

impl Storable for TaskId {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("User encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode User bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Unbounded;
}
#[update]
async fn verify_discord_token(
    task_id: u64,
    subtask_id: u64,
    discord_token: String,
    guild_id: String,
) -> Result<bool, Error> {
    ic_cdk::println!("VERIFY DISCORD TOKEN START: task_id={} subtask_id={} guild_id={}", task_id, subtask_id, guild_id);
    let verified = verify_token_with_discord(&discord_token, &guild_id)
        .await
        .map_err(|e| Error::InvalidDiscordToken)?;
    Ok(verified)
}

async fn verify_token_with_discord(discord_token: &str, guild_id: &str) -> Result<bool, String> {
    let request = CanisterHttpRequestArgument {
        url: "https://discord.com/api/users/@me/guilds".to_string(),
        method: HttpMethod::GET,
        headers: vec![
            HttpHeader {
                name: "Authorization".to_string(),
                value: format!("Bearer {}", discord_token),
            },
            HttpHeader {
                name: "Content-Type".to_string(),
                value: "application/json".to_string(),
            },
        ],
        body: None,
        max_response_bytes: Some(2_000_000),
        transform: None,
    };

    let cycles: u128 = 100_000_000_000;
    let (response,): (HttpResponse,) = ic_cdk::api::management_canister::http_request::http_request(
    request,
    cycles
    ).await.map_err(|e| {
        ic_cdk::println!("Błąd HTTP: {:?}", e);
        format!("HTTP request failed: {:?}", e)
    })?;
     
    ic_cdk::println!("Discord response status: {:?}", response.status);
    ic_cdk::println!("Discord response body: {:?}", String::from_utf8_lossy(&response.body));

    if response.status != 200u64 {
        return Err(format!("Discord API returned status code {}", response.status));
    }

    let guilds: Vec<DiscordGuild> = serde_json::from_slice(&response.body)
        .map_err(|e| format!("Failed to deserialize Discord guilds: {:?}", e))?;

    ic_cdk::println!("Parsed guilds: {:?}", guilds);

    let is_member= guilds.iter().any(|guild| guild.id == guild_id);

    ic_cdk::println!("IS MEMBER? {} (Searching: {})", is_member, guild_id);

    Ok(is_member)
}
