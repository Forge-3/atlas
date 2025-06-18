use crate::{
    errors::Error,
    guard::{parent_or_owner_or_admin_guard, user_is_in_space},
    memory,
    task::{submission::Submission, CreateTaskArgs, Task, TaskId, TaskType},
};
use candid::Principal;
use ic_cdk::{
    api::management_canister::http_request::{ TransformContext, CanisterHttpRequestArgument, HttpHeader, HttpMethod, HttpResponse},
    update,
};
use serde_json;
use ic_stable_structures::Storable;
use sha2::Digest;

#[derive(Debug, serde::Deserialize, candid::CandidType, serde::Serialize, Clone)]
    pub struct DiscordGuild {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    }

#[derive(candid::CandidType, serde::Deserialize, Debug, serde::Serialize, Clone)]
pub struct DiscordInviteApiResponse {
    pub code: String,
    pub guild: Option<DiscordGuild>,
    pub expires_at: Option<String>, 
}

#[derive(serde::Serialize, serde::Deserialize)]
struct InviteResponse {
    code: String,
}

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
    let caller = user_is_in_space().await?;

    #[derive(Debug)]
    enum DiscordVerificationData {
        Required { access_token: String, task_guild_id: String },
        NotRequired,
        Error(Error),
    }

    let discord_check_result: DiscordVerificationData = memory::mut_open_task(task_id.clone(), |task_opt| {
        let task = match task_opt.as_mut().ok_or(DiscordVerificationData::Error(Error::TaskDoNotExists(task_id.clone()))) {
            Ok(task) => task,
            Err(e) => return e,
        };

        let subtask = match task.tasks.get_mut(subtask_id).ok_or(DiscordVerificationData::Error(Error::SubtaskDoNotExists(subtask_id))) {
            Ok(task) => task,
            Err(e) => return e,
        };

        if let TaskType::DiscordTask { guild_id: task_guild_id, .. } = subtask {
            if let Submission::Discord { access_token, guild_id: _ } = &submission {
                DiscordVerificationData::Required { 
                    access_token: access_token.clone(), 
                    task_guild_id: task_guild_id.clone()
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
        DiscordVerificationData::Required { access_token, task_guild_id } => {
            if !is_member_of_guild(access_token, task_guild_id.clone())
                .await
                .map_err(|e| Error::IncorrectSubmission(e))? {
                return Err(Error::IncorrectSubmission("User is not a member of the guild".to_string()));
            }
            ic_cdk::println!("User {} is a member of guild {}!", caller, task_guild_id);
        },
        DiscordVerificationData::NotRequired => {
        },
        DiscordVerificationData::Error(err) => {
            return Err(err);
        }
    }

    memory::mut_open_task(task_id.clone(), |task_opt| {
    let task = task_opt
        .as_mut()
        .ok_or(Error::TaskDoNotExists(task_id.clone()))?;

    task.submit_subtask_submission(caller, subtask_id, submission.clone())
})??;

    Ok(())
}

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
}

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

    let guilds: Vec<DiscordGuild> = serde_json::from_slice(&response.body)
        .map_err(|e| format!("Failed to deserialize Discord guilds: {:?}", e))?;

    let is_member = guilds.iter().any(|guild| {
        ic_cdk::println!("Checking guild: {} (ID: {}) against target guild_id: {}", guild.name, guild.id, guild_id);
        guild.id == guild_id
    });

    Ok(is_member)
}

#[update]
pub async fn get_discord_guilds(discord_token: String) -> Result<Vec<DiscordGuild>, String> {
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
    let (response,): (HttpResponse,) = match ic_cdk::api::management_canister::http_request::http_request(
        request,
        cycles
    ).await {
        Ok(res) => res,
        Err((r, m)) => {
            ic_cdk::println!("HTTP Request Error: {:?} {}", r, m);
            return Err(format!("HTTP request failed: {:?}", m));
        }
    };

    if response.status != 200u64 {
        return Err(format!("Discord API returned status code {}", response.status));
    }

    let guilds: Vec<DiscordGuild> = serde_json::from_slice(&response.body)
        .map_err(|e| format!("Failed to deserialize Discord guilds: {:?}", e))?;

    Ok(guilds)
}

#[update]
pub async fn validate_discord_invite_link(
    invite_link: String,
    expected_guild_id: String,
) -> Result<DiscordInviteApiResponse, String> {
    let invite_code = invite_link
        .trim_start_matches("https://discord.gg/")
        .trim_start_matches("https://discord.com/invite/");

    if invite_code.is_empty() || invite_code.contains('/') {
        return Err("Invalid Discord invite link format: no invite code found or contains invalid characters.".to_string());
    }

    let url = format!("https://discord.com/api/v10/invites/{}?with_counts=false", invite_code);

    let request_headers = vec![
        HttpHeader {
            name: "User-Agent".to_string(),
            value: "application/json".to_string(),
        },
    ];

    let request = CanisterHttpRequestArgument {
        url: url.to_string(),
        method: HttpMethod::GET,
        headers: request_headers,
        body: None,
        max_response_bytes: Some(2_000_000),
        transform: Some(TransformContext {
            function: ic_cdk::api::management_canister::http_request::TransformFunc::new(
                ic_cdk::api::id(),
                "transform_http_response".to_string(),
            ),
            context: vec![],
        }),
    };

    ic_cdk::println!("Sending HTTP GET request to Discord API for invite: {}", url);

    let cycles_cost: u128 = 20_949_826_400;

    match ic_cdk::api::management_canister::http_request::http_request(request, cycles_cost).await {
        Ok((response,)) => {
            let body_str = String::from_utf8_lossy(&response.body);
            ic_cdk::println!("Discord API response status: {}", response.status);
            ic_cdk::println!("Discord API response body: {}", body_str);

            if response.status != 200u64 {
                let error_detail = if response.status == 404u64 {
                    "Invite not found or expired.".to_string()
                } else {
                    format!("Discord API returned status {}: {}", response.status, body_str)
                };
                return Err(format!("Discord invite link is invalid or expired. {}", error_detail));
            }

            let invite_data: DiscordInviteApiResponse = serde_json::from_str(&body_str)
                .map_err(|e| format!("Failed to parse Discord API invite response: {}", e))?;

            match &invite_data.guild {
                Some(guild) => {
                    if guild.id == expected_guild_id {
                        Ok(invite_data)
                    } else {
                        Err(format!(
                            "Discord invite link leads to a different server (ID: {}). Expected: {}",
                            guild.name, expected_guild_id
                        ))
                    }
                },
                None => {
                    Err("Discord invite link does not lead to a valid server (guild information missing in API response).".to_string())
                }
            }
        },
        Err((r_code, err_msg)) => {
            let error_message = format!("HTTP request to Discord failed with code {:?} and message: {}", r_code, err_msg);
            ic_cdk::eprintln!("{}", error_message);
            Err(error_message)
        },
    }
}