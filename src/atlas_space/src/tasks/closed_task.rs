use crate::errors::Error;
use std::{borrow::Cow, collections::HashSet};

use crate::tasks::submission::SubmissionState;
use crate::tasks::task::Task;
use crate::tasks::task_types::{TaskId, TaskType};
use crate::tasks::token_reward::TokenReward;
use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use sha2::Digest;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct ClosedTask {
    #[cbor(n(0), with = "shared::cbor::principal")]
    pub(crate) creator: Principal,
    #[n(1)]
    pub(crate) token_reward: TokenReward,
    #[n(2)]
    pub(crate) tasks: Vec<TaskType>, // only accepted tasks have content
    #[n(3)]
    pub(crate) number_of_uses: u64,
    #[n(4)]
    pub(crate) task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    pub(crate) rewarded: Vec<Principal>,
    #[n(6)]
    pub(crate) start_time: u64, // in seconds
    #[n(7)]
    pub(crate) end_time: u64, // in seconds
    #[n(8)]
    pub(crate) refunded: bool, // Indicates if creator has claimed unused rewards
}

impl ClosedTask {
    pub async fn claim_all_rewards(&mut self, task_id: TaskId) -> Result<(), Error> {
        let tasks = self.tasks.clone();
        let not_rewarded = tasks
            .first()
            .expect("First subtask to not exist?!")
            .get_submission_map()
            .iter()
            .filter(|(principal, _)| !self.rewarded.contains(principal));

        let users_to_rewarded: HashSet<_> = not_rewarded
            .into_iter()
            .filter(|(principal, _)| {
                tasks.iter().all(|task| {
                    task.get_submission(**principal)
                        .map(|sub| sub.get_state() == &SubmissionState::Accepted)
                        .unwrap_or(false)
                })
            })
            .map(|(principal, _)| principal)
            .collect();

        for principal in users_to_rewarded {
            let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
            self.claim_reward(*principal, subaccount).await?;
        }

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

    pub async fn claim_remains(&mut self, subaccount: [u8; 32]) -> Result<(), Error> {
        if self.refunded {
            return Err(Error::RewardAlreadyRefunded);
        }

        let rewarded_count = self.rewarded.len() as u64;
        if rewarded_count >= self.number_of_uses {
            return Ok(());
        }

        if self.tasks.is_empty() {
            self.token_reward
                .withdraw_remains(self.creator, subaccount, self.number_of_uses)
                .await?;
            self.refunded = true;
            return Ok(());
        }

        let first_task_accepted_users: HashSet<_> = self
            .tasks
            .first()
            .expect("First subtask to not exist?!")
            .get_submission_map()
            .iter()
            .filter_map(|(user, data)| {
                if data.get_state() == &SubmissionState::Accepted {
                    Some(user)
                } else {
                    None
                }
            })
            .collect();

        let accepted_users: HashSet<_> = first_task_accepted_users
            .into_iter()
            .filter(|user| {
                self.tasks.iter().all(|task| {
                    task.get_submission(**user)
                        .map(|sub| sub.get_state() == &SubmissionState::Accepted)
                        .unwrap_or(false)
                })
            })
            .cloned()
            .collect();

        let mut combined: HashSet<Principal> = accepted_users;
        combined.extend(self.rewarded.iter().cloned());

        let unused = self.number_of_uses - combined.len() as u64;
        if unused == 0 {
            return Err(Error::AllRewardsClaimed);
        }

        self.token_reward
            .withdraw_remains(self.creator, subaccount, unused)
            .await?;
        self.refunded = true;
        Ok(())
    }
}

impl From<Task> for ClosedTask {
    fn from(task: Task) -> Self {
        Self {
            creator: task.creator,
            token_reward: task.token_reward,
            tasks: task
                .tasks
                .into_iter()
                .map(|task_type| task_type.clone_with_accepted_only())
                .collect(),
            number_of_uses: task.number_of_uses,
            task_title: task.task_title,
            rewarded: task.rewarded,
            start_time: task.start_time,
            end_time: task.end_time,
            refunded: false,
        }
    }
}

impl Storable for ClosedTask {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("ClosedTask encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
            panic!(
                "failed to decode ClosedTask bytes {}: {e}",
                hex::encode(bytes)
            )
        })
    }

    const BOUND: Bound = Bound::Unbounded;
}
