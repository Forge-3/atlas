use crate::errors::Error;
use std::borrow::Cow;

use crate::tasks::submission::SubmissionState;
use crate::tasks::task::Task;
use crate::tasks::task_types::{TaskType, TaskId};
use crate::tasks::token_reward::TokenReward;
use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use sha2::Digest;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Clone, CandidType)]
pub struct ClosedTask {
    #[cbor(n(0), with = "shared::cbor::principal")]
    creator: Principal,
    #[n(1)]
    token_reward: TokenReward,
    #[n(2)]
    tasks: Vec<TaskType>, // only accepted tasks have content
    #[n(3)]
    number_of_uses: u64,
    #[n(4)]
    task_title: String,
    #[cbor(n(5), with = "shared::cbor::principal::vec")]
    rewarded: Vec<Principal>,
    #[n(6)]
    start_time: u64, // in seconds
    #[n(7)]
    end_time: u64, // in seconds
    #[n(8)]
    refunded: bool, // Indicates if creator has claimed unused rewards
}

impl ClosedTask {
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

    pub async fn claim_all_rewards(&mut self, task_id: TaskId) -> Result<(), Error>{
        let users: std::collections::HashSet<_> = self
            .tasks
            .iter()
            .flat_map(|task| {
                task.get_submission_map().iter().filter_map(|(user, data)| {
                    if data.get_state() == &SubmissionState::Accepted
                        && !self.rewarded.contains(user)
                    {
                        Some(user.clone())
                    } else {
                        None
                    }
                })
            })
            .collect();

        for user in users {
            let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
            self.claim_reward(user, subaccount).await?;
        }
        
        Ok(())
    }

    pub async fn claim_remains(&mut self, subaccount: [u8; 32]) -> Result<(), Error> {
        if self.refunded {
            return Err(Error::RewardAlreadyRefunded);
        }

        let rewarded_count = self.rewarded.len() as u64;
        if rewarded_count >= self.number_of_uses {
            return Err(Error::AllRewardsClaimed);
        }

        if self.tasks.is_empty() {
            self.token_reward
                .withdraw_remains(self.creator, subaccount, self.number_of_uses)
                .await?;
            self.refunded = true;
            return Ok(());
        }

        let first_task_accepted_users: std::collections::HashSet<_> = self.tasks[0]
            .get_submission_map()
            .iter()
            .filter_map(|(user, data)| {
                if data.get_state() == &SubmissionState::Accepted {
                    Some(*user)
                } else {
                    None
                }
            })
            .collect();

        let accepted_users: std::collections::HashSet<Principal> = first_task_accepted_users
            .into_iter()
            .filter(|user| {
                self.tasks
                    .iter()
                    .all(|task| match task.get_submission(*user) {
                        Ok(sub) => sub.get_state() == &SubmissionState::Accepted,
                        Err(_) => false,
                    })
            })
            .collect();

        let unused = self.number_of_uses - accepted_users.len() as u64;
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
