use crate::errors::Error;
use crate::memory;
use crate::tasks::task_types::TaskId;
use crate::tasks::timer_logic;
use crate::tasks::token_reward::TokenReward;
use crate::tasks::token_reward::SINGLE_AFFILIATION_REWARD;
use candid::Principal;
use ic_cdk::call::Call;
use ic_stable_structures::Storable;
use num_traits::cast::ToPrimitive;
use sha2::Digest;

pub async fn accept_open_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    memory::mut_open_task(task_id, |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        if task.is_fully_rewarded() {
            return Err(Error::AllRewardsClaimed);
        }
        task.accept_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    let mut task = memory::get_open_task(&task_id).ok_or(Error::TaskDoNotExists(task_id))?;
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();

    ic_cdk::println!("Trying to claim rewards");
    let mut claim_successful = false;
    match task.claim_reward(user, subaccount).await {
        Ok(_) => {
            ic_cdk::println!("Reward distributed.");
            claim_successful = true;

            let parent = memory::read_config(|c| c.parent());
            let TokenReward::CkUsdc { amount } = &task.token_reward;
            let reward_amount: u64 = amount
                .as_ref()
                .0
                .to_u64()
                .ok_or(Error::FailedToParse("Nat256 does not fit in u64".into()))?;

            if let Err(err) = Call::bounded_wait(parent, "add_task_reward_xp")
                .with_args(&(user, reward_amount))
                .await
                .map_err(|err| Error::FailedToCallMain(err.to_string()))?
                .candid::<Result<(), Error>>()
            {
                ic_cdk::println!("Failed to add XP ({reward_amount}) to user {user}: {err}");
                // log for admin to for example add XP manually
            }
        }
        Err(_) => ic_cdk::println!("Failed to distribute reward"),
    }

    memory::mut_open_task(task_id, |maybe_task| {
        let task_in_memory = maybe_task.as_mut().expect("Task should always exist here");
        *task_in_memory = task.clone();
        Ok(())
    })??;

    if claim_successful {
        let mut task = memory::get_open_task(&task_id).expect("Task should always exist here");
        if task.referrals.contains_key(&user)
            && task.claim_affiliate_reward(user, subaccount).await.is_ok()
        {
            let parent = memory::read_config(|c| c.parent());
            let inviter = task
                .referrals
                .get(&user)
                .expect("Invitee has to exist at this point")
                .inviter;

            Call::bounded_wait(parent, "register_referral_reward")
                .with_args(&(
                    inviter,
                    ic_cdk::api::canister_self(),
                    task_id,
                    user,
                    SINGLE_AFFILIATION_REWARD,
                ))
                .await
                .map_err(|err| Error::FailedToCallMain(err.to_string()))?
                .candid::<Result<(), Error>>()
                .map_err(|err| Error::FailedToParse(err.to_string()))??;
        }

        memory::mut_open_task(task_id, |maybe_task| {
            let task_in_memory = maybe_task.as_mut().expect("Task should always exist here");
            *task_in_memory = task.clone();
            Ok(())
        })??;
    }

    let task = memory::get_open_task(&task_id).expect("Task should always exist here");
    let number_of_uses: usize = task
        .number_of_uses
        .try_into()
        .expect("u64 do not fit in usize?");
    if number_of_uses == task.rewarded.len() {
        ic_cdk::println!("All rewards distributed. Expiring task {task_id}");
        timer_logic::force_expire_task(task_id).await?;
    }

    Ok(())
}

pub async fn accept_expired_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    memory::mut_expired_task(task_id, |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        if task.is_fully_rewarded() {
            return Err(Error::AllRewardsClaimed);
        }
        task.accept_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    let mut task = memory::get_expired_task(&task_id).ok_or(Error::TaskDoNotExists(task_id))?;
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();

    ic_cdk::println!("Trying to claim rewards");
    let mut claim_successful = false;
    match task.claim_reward(user, subaccount).await {
        Ok(_) => {
            ic_cdk::println!("Reward distributed.");
            claim_successful = true;

            let parent = memory::read_config(|c| c.parent());
            let TokenReward::CkUsdc { amount } = &task.token_reward;
            let reward_amount: u64 = amount
                .as_ref()
                .0
                .to_u64()
                .ok_or(Error::FailedToParse("Nat256 does not fit in u64".into()))?;

            if let Err(err) = Call::bounded_wait(parent, "add_task_reward_xp")
                .with_args(&(user, reward_amount))
                .await
                .map_err(|err| Error::FailedToCallMain(err.to_string()))?
                .candid::<Result<(), Error>>()
            {
                ic_cdk::println!("Failed to add XP ({reward_amount}) to user {user}: {err}");
                // log for admin to for example add XP manually
            }
        }
        Err(_) => ic_cdk::println!("Failed to distribute reward"),
    }

    memory::mut_expired_task(task_id, |maybe_task| {
        let task_in_memory = maybe_task.as_mut().expect("Task should always exist here");
        *task_in_memory = task.clone();
        Ok(())
    })??;

    if claim_successful {
        let mut task = memory::get_expired_task(&task_id).expect("Task should always exist here");
        if task.referrals.contains_key(&user)
            && task.claim_affiliate_reward(user, subaccount).await.is_ok()
        {
            let parent = memory::read_config(|c| c.parent());
            let inviter = task
                .referrals
                .get(&user)
                .expect("Invitee has to exist at this point")
                .inviter;

            Call::bounded_wait(parent, "register_referral_reward")
                .with_args(&(
                    inviter,
                    ic_cdk::api::canister_self(),
                    task_id,
                    user,
                    SINGLE_AFFILIATION_REWARD,
                ))
                .await
                .map_err(|err| Error::FailedToCallMain(err.to_string()))?
                .candid::<Result<(), Error>>()
                .map_err(|err| Error::FailedToParse(err.to_string()))??;
        }

        memory::mut_expired_task(task_id, |maybe_task| {
            let task_in_memory = maybe_task.as_mut().expect("Task should always exist here");
            *task_in_memory = task.clone();
            Ok(())
        })??;
    }

    Ok(())
}
