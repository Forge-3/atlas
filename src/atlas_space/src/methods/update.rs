use crate::{
    errors::Error,
    guard::{parent_or_owner_or_admin_guard, user_is_in_space},
    memory,
    task::{submission::Submission, CreateTaskArgs, Task, TaskId, TaskType},
};
<<<<<<< HEAD

use candid::Principal;
use ic_cdk::update;
=======
use candid::Encode;
use ic_cdk::{
    api::management_canister::main::{CanisterInstallMode, InstallCodeArgument},
    update,
};
use ic_cdk::api::management_canister::http_request::{ CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse};
use serde_json;
>>>>>>> 63e0bd6 (Unify Subtask Submission & Refactor getUserData to getGuildData)
use ic_stable_structures::Storable;
use sha2::Digest;
#[update]
pub async fn set_space_name(name: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_name(name));
    Ok(())
}

#[update]
pub async fn set_space_description(description: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_description(description));
    Ok(())
}

#[update]
pub async fn set_space_logo(logo: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_logo(logo));
    Ok(())
}

#[update]
pub async fn set_space_background(space_background: String) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;

    memory::mut_state(|state| state.set_space_background(space_background));
    Ok(())
}

#[update]
pub async fn create_task(args: CreateTaskArgs) -> Result<TaskId, Error> {
    let caller = parent_or_owner_or_admin_guard().await?;
    args.validate()?;
    let next_task_id = memory::mut_state(|state| TaskId::new(state.get_next_task_id()));

    let subaccount = sha2::Sha256::digest(next_task_id.u64().to_bytes()).into();
    memory::insert_open_task(
        next_task_id.clone(),
        Task::new(caller, args, subaccount).await.unwrap(),
    )
    .unwrap();

    Ok(next_task_id)
}

#[update]
pub async fn submit_subtask_submission(
    task_id: TaskId,
    subtask_id: usize,
    submission: Submission,
) -> Result<(), Error> {
<<<<<<< HEAD
    let caller = user_is_in_space().await?;
    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.submit_subtask_submission(caller, subtask_id, submission)?;
=======
    let caller = authenticated_guard()?;
>>>>>>> 63e0bd6 (Unify Subtask Submission & Refactor getUserData to getGuildData)

    #[derive(Debug)]
    enum DiscordVerificationData {
        Required { access_token: String, guild_id: String },
        NotRequired,
        Error(Error),
    }

    let discord_check_result: DiscordVerificationData = memory::mut_open_task(task_id.clone(), |task_opt| {
        let task = match task_opt.as_mut() {
            Some(t) => t,
            None => return DiscordVerificationData::Error(Error::TaskDoNotExists(task_id.clone())),
        };

        let subtask = match task.tasks.get_mut(&subtask_id) {
            Some(s) => s,
            None => return DiscordVerificationData::Error(Error::SubtaskDoNotExists(subtask_id)),
        };

        if let TaskType::DiscordTask { .. } = subtask {
            if let Submission::Discord { access_token, guild_id } = &submission {
                DiscordVerificationData::Required { 
                    access_token: access_token.clone(), 
                    guild_id: guild_id.clone() 
                }
            } else {
                DiscordVerificationData::Error(Error::IncorrectSubmission("Expected Discord submission for DiscordTask".to_string()))
            }
        } else {
            DiscordVerificationData::NotRequired
        }
    })
    .map_err(|e| e)?;

    match discord_check_result {
        DiscordVerificationData::Required { access_token, guild_id } => {
            let guild_id_clone = guild_id.clone();
            if !is_member_of_guild(access_token, guild_id)
                .await
                .map_err(|e| Error::IncorrectSubmission(e))? {
                return Err(Error::IncorrectSubmission("User is not a member of the guild".to_string()));
            }
            ic_cdk::println!("User {} is a member of guild {}!", caller, guild_id_clone);
        },
        DiscordVerificationData::NotRequired => {
        },
        DiscordVerificationData::Error(err) => {
            return Err(err);
        }
    }

    let final_submit_result: Result<(), Error> = memory::mut_open_task(task_id.clone(), |task_opt| {
        let task = task_opt
            .as_mut()
            .ok_or(Error::TaskDoNotExists(task_id.clone()))?;

        let subtask = task
            .tasks
            .get_mut(&subtask_id)
            .ok_or(Error::SubtaskDoNotExists(subtask_id))?;

        subtask.submit(caller, submission.clone())
    })?;

    final_submit_result?;

    Ok(())
}

<<<<<<< HEAD
#[update]
pub async fn accept_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.accept_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    Ok(())
}

#[update]
pub async fn reject_subtask_submission(
    user: Principal,
    task_id: TaskId,
    subtask_id: usize,
) -> Result<(), Error> {
    parent_or_owner_or_admin_guard().await?;
    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        task.reject_subtask_submission(user, subtask_id)?;
        Ok(())
    })??;

    Ok(())
}

#[update]
pub async fn withdraw_reward(task_id: TaskId) -> Result<(), Error> {
    let caller = user_is_in_space().await?;
    let mut old_task = memory::get_open_tasks(&task_id).ok_or(Error::TaskDoNotExists(task_id))?;
    let subaccount = sha2::Sha256::digest(task_id.u64().to_bytes()).into();
    old_task.claim_reward(caller, subaccount).await?;

    memory::mut_open_task(task_id.clone(), |maybe_task| {
        let task = maybe_task.as_mut().ok_or(Error::TaskDoNotExists(task_id))?;
        *task = old_task;
        Ok(())
    })??;
    Ok(())
=======

async fn is_member_of_guild(discord_token: String, guild_id: String) -> Result<bool, String> {
    let initial_canister_balance = ic_cdk::api::canister_balance();
    ic_cdk::println!("Initial canister cycles balance before Discord HTTP call: {}", initial_canister_balance);
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

    let cycles: u128 = 22_943_726_917;
    ic_cdk::println!("Attempting Discord HTTP request with {} cycles.", cycles);
    let (response,): (HttpResponse,) = ic_cdk::api::management_canister::http_request::http_request(
        request,
        cycles
    ).await.map_err(|e| {
        ic_cdk::println!("HTTP Request Error: {:?}", e);
        format!("HTTP request failed: {:?}", e)
    })?;

    ic_cdk::println!("Discord response status: {:?}", response.status);
    ic_cdk::println!("Discord response body: {:?}", String::from_utf8_lossy(&response.body));

    if response.status != 200u64 {
        return Err(format!("Discord API returned status code {}", response.status));
    }

    #[derive(Debug, serde::Deserialize)]
    struct DiscordGuild {
        id: String,
        name: String,
    }

    let guilds: Vec<DiscordGuild> = serde_json::from_slice(&response.body)
        .map_err(|e| format!("Failed to deserialize Discord guilds: {:?}", e))?;

    Ok(guilds.iter().any(|guild| guild.id == guild_id))
>>>>>>> 63e0bd6 (Unify Subtask Submission & Refactor getUserData to getGuildData)
}
