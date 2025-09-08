use std::collections::BTreeMap;

use candid::Nat;
use candid::{CandidType, Encode, Principal};
use ic_cdk::call::Call;
use ic_cdk::management_canister::{
    delete_canister, install_code, stop_canister, CanisterInstallMode, DeleteCanisterArgs,
    InstallCodeArgs, StopCanisterArgs,
};
use ic_cdk::update;
use serde::Deserialize;
use shared::{SpaceArgs, SpaceInitArg};

use crate::guard::{{admin_or_space_lead_guard, super_admin_guard}, space_caller_guard};
use crate::{
    errors::Error,
    guard::authenticated_guard,
    memory,
    space::{self, Space, SpaceType},
    user::{Rank, User},
};

#[update]
pub fn set_user_space_lead(user_id: Principal) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    memory::user_rank_match(&caller, &[Rank::Admin, Rank::SuperAdmin])?;

    if let Some(mut user) = memory::get_user(&user_id) {
        user.promote_to_space_lead()?;
        memory::insert_user(user_id, user);
    } else {
        memory::insert_user(user_id, User::new(Rank::SpaceLead));
    }
    Ok(())
}

#[update]
pub fn set_user_admin(user_id: Principal) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    memory::user_rank_match(&caller, &[Rank::SuperAdmin])?;
    if let Some(mut user) = memory::get_user(&user_id) {
        user.promote_to_admin()?;
        memory::insert_user(user_id, user);
    } else {
        memory::insert_user(user_id, User::new(Rank::Admin));
    }
    Ok(())
}

#[update]
pub async fn create_new_space(
    space_name: String,
    space_description: String,
    space_symbol: Option<String>,
    space_logo: Option<String>,
    space_background: Option<String>,
    space_type: SpaceType,
    external_links: BTreeMap<String, String>,
) -> Result<Space, Error> {
    let caller = authenticated_guard()?;
    let user = memory::user_rank_match(&caller, &[Rank::SpaceLead, Rank::Admin, Rank::SuperAdmin])?;
    let config = memory::read_config(|local_config| local_config.clone());

    if user.rank() == &Rank::SpaceLead
        && user.owned_spaces_count() >= config.spaces_per_space_lead as usize
    {
        return Err(Error::UserRichSpaceLimit {
            expected: config.spaces_per_space_lead as usize,
            found: user.owned_spaces_count(),
        });
    }

    if user.space_creation_in_progress() {
        return Err(Error::CreationInProgress);
    }

    memory::mut_user(caller, |maybe_user| {
        let mut user = maybe_user.expect("User do not exist?!");
        user.set_space_creation(true);
        Ok(user)
    })?;

    let space_init_args = SpaceInitArg {
        owner: caller,
        space_name,
        space_description,
        space_symbol,
        space_logo,
        space_background,
        ckusdc_ledger: shared::CkUsdcLedger {
            principal: config.ckusdc_ledger.principal,
            fee: config.ckusdc_ledger.fee,
        },
        current_wasm_version: config.current_space_version,
        external_links,
    };
    let space = Space::create_space(space_init_args, space_type).await;
    memory::mut_user(caller, |maybe_user| {
        let mut user = maybe_user.expect("User do not exist?!");
        user.set_space_creation(false);
        Ok(user)
    })?;
    let space = space?;

    let space_index = memory::push_space(&space)?;
    memory::mut_user(caller, |maybe_user| {
        let mut user = maybe_user.expect("User do not exist?!");
        user.push_space(space_index);
        Ok(user)
    })?;

    Ok(space)
}

#[update]
pub async fn upgrade_space(space_id: Principal) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    let user = memory::user_rank_match(&caller, &[Rank::Admin, Rank::SuperAdmin, Rank::SpaceLead])?;

    if user.rank() == &Rank::SpaceLead {
        let owned_spaces: Vec<_> = user
            .owned_spaces()
            .iter()
            .filter_map(|&i| memory::get_space(i))
            .collect();

        if owned_spaces
            .iter()
            .any(|space| space.principal() == space_id)
        {
            return Err(Error::UserNotAnOwner(space_id));
        }
    }

    let current_bytecode_version = super::query::get_current_space_bytecode_version();
    let current_space_bytecode_version =
        Call::bounded_wait(space_id, "get_current_bytecode_version")
            .with_args(&())
            .await
            .map_err(|err| Error::FailedToCallSpace {
                err: err.to_string(),
                principal: space_id,
            })?
            .candid::<u64>()
            .map_err(|err| Error::FailedToParse(err.to_string()))?;

    if current_bytecode_version == current_space_bytecode_version {
        return Ok(());
    }
    if current_space_bytecode_version > current_bytecode_version {
        ic_cdk::trap("Space is ahead of main WASM?!")
    }
    let start_from_version = current_space_bytecode_version
        .checked_add(1)
        .expect("Version out of range?!");

    for version in start_from_version..=current_bytecode_version {
        let next_bytecode =
            space::get_space_bytecode_by_version(version).expect("Bytecode version do not exist?!");

        let arg = Some(SpaceArgs::UpgradeArg { version });
        install_code(&InstallCodeArgs {
            mode: CanisterInstallMode::Upgrade(None),
            canister_id: space_id,
            wasm_module: next_bytecode,
            arg: Encode!(&arg).expect("Failed to decode args"),
        })
        .await
        .unwrap();
        space::migration::migrate(version, space_id).await;
        ic_cdk::println!(
            "Successfully upgraded {} to version {}",
            ic_cdk::api::canister_self(),
            version
        );
    }

    Ok(())
}

#[update]
pub fn join_space(space_id: Principal) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    let (index, space) = memory::with_space_vec_iter(|spaces| {
        spaces.enumerate().find(|(_, maybe_space)| {
            maybe_space
                .as_ref()
                .map(|s| s.principal() == space_id)
                .unwrap_or(false)
        })
    })
    .ok_or(Error::SpaceNotExist)?;
    let space = space.unwrap();

    if space.space_type() == SpaceType::HUB {
        let user = memory::get_user(&caller).unwrap_or_default();
        let is_hub_member = user.belonging_to_spaces().iter().any(|space_index| {
            memory::get_space(*space_index)
                .expect("Space do not exist?!")
                .space_type()
                == SpaceType::HUB
        });
        if is_hub_member {
            return Err(Error::UserAlreadyIsHubMember);
        }
    }

    memory::mut_user(caller, |maybe_user| {
        let mut user = maybe_user.unwrap_or_default();
        user.join_space(index.try_into().unwrap());
        Ok(user)
    })?;

    Ok(())
}

#[derive(Debug, CandidType, Deserialize)]
pub struct TransferSpace {
    space_id: Principal,
    to: Principal,
}

#[update]
pub async fn transfer_space(args: TransferSpace) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    memory::user_rank_match(&caller, &[Rank::SpaceLead, Rank::Admin, Rank::SuperAdmin])?;
    let to_user =
        memory::user_rank_match(&args.to, &[Rank::SpaceLead, Rank::Admin, Rank::SuperAdmin])?;
    let config = memory::read_config(|local_config| local_config.clone());

    if to_user.rank() == &Rank::SpaceLead
        && to_user.owned_spaces_count() >= config.spaces_per_space_lead as usize
    {
        return Err(Error::UserRichSpaceLimit {
            expected: config.spaces_per_space_lead as usize,
            found: to_user.owned_spaces_count(),
        });
    }

    let (space_index, _opt_space) = memory::with_space_vec_iter(|spaces| {
        spaces.enumerate().find(|(_, maybe_space)| {
            maybe_space
                .as_ref()
                .map(|s| s.principal() == args.space_id)
                .unwrap_or(false)
        })
    })
    .ok_or(Error::SpaceNotExist)?;

    let space_owner = if memory::user_rank_match(&caller, &[Rank::Admin, Rank::SuperAdmin]).is_ok()
    {
        memory::with_users_iter(|mut users| {
            users
                .find(|(_, user)| user.owned_spaces.contains(&(space_index as u64)))
                .map(|(id, _)| id)
        })
        .ok_or(Error::SpaceNotExist)?
    } else {
        caller
    };

    if args.to == space_owner {
        return Ok(());
    }

    memory::mut_user(space_owner, |maybe_user| {
        let mut user = maybe_user.expect("User do not exist?!");
        let space_index = user
            .owned_spaces
            .iter()
            .position(|item| Nat::from(*item) == space_index);

        user.owned_spaces
            .remove(space_index.ok_or(Error::UserNotOwner)?);
        Ok(user)
    })?;
    memory::mut_user(args.to, |maybe_user| {
        let mut user = maybe_user.expect("User do not exist?!");
        user.push_space(space_index.try_into().unwrap());
        Ok(user)
    })?;

    Call::bounded_wait(args.space_id, "transfer_space")
        .with_arg(args.to)
        .await
        .expect("Failed to transfer space")
        .candid::<()>()
        .expect("Failed to read response");

    Ok(())
}

#[update]
pub async fn delete_space(space_id: Principal) -> Result<(), Error> {
    let (_caller, user) = admin_or_space_lead_guard()?;
    let space_index = memory::with_space_vec_iter(|iter| {
        iter.enumerate()
            .find(|(_, opt_space)| {
                opt_space
                    .as_ref()
                    .map(|space| space.principal() == space_id)
                    .unwrap_or(false)
            })
            .map(|(i, _)| i as u64)
    })
    .ok_or(Error::SpaceNotExist)?;

    if user.rank() == &Rank::SpaceLead && !user.owned_spaces().contains(&space_index) {
        return Err(Error::UserNotOwner);
    }

    Call::bounded_wait(space_id, "clean_up_space_before_deletion")
        .with_arg(())
        .await
        .map_err(|err| Error::FailedToCallSpace {
            err: err.to_string(),
            principal: space_id,
        })?
        .candid::<Result<(), String>>()
        .map_err(|err| Error::FailedToCleanSpace {
            err: err.to_string(),
            principal: space_id,
        })?
        .map_err(|err_string| Error::FailedToCleanSpace {
            err: err_string,
            principal: space_id,
        })?;

    stop_canister(&StopCanisterArgs {
        canister_id: space_id,
    })
    .await
    .unwrap_or_else(|err| panic!("Failed to stop canister: {err}"));

    delete_canister(&DeleteCanisterArgs {
        canister_id: space_id,
    })
    .await
    .unwrap_or_else(|err| panic!("Failed to delete canister: {err}"));

    memory::remove_space(space_index)?;

    let mut users_to_update = vec![];
    memory::with_users_iter(|iter| {
        iter.for_each(|(user_id, mut user)| {
            let mut changed = false;

            if let Some(pos) = user.owned_spaces().iter().position(|&i| i == space_index) {
                user.owned_spaces.remove(pos);
                changed = true;
            }
            if let Some(pos) = user
                .belonging_to_spaces()
                .iter()
                .position(|&i| i == space_index)
            {
                user.leave_space(pos);
                changed = true;
            }
            if changed {
                users_to_update.push((user_id, user));
            }
        });
    });

    users_to_update.into_iter().for_each(|(id, user)| {
        memory::insert_user(id, user);
    });

    Ok(())
}

#[update]
pub fn remove_space_bytecode(version: u64) -> Result<(), Error> {
    super_admin_guard()?;
    memory::remove_bytecode_by_version(&version)
}

#[update]
pub async fn register_referral_reward(
    user: Principal,
    space_principal: Principal,
    task_id: u64,
    invitee: Principal,
    amount: u64,
) -> Result<(), Error> {
    space_caller_guard()?;
    let space_index =
        memory::space_principal_to_index(space_principal).ok_or(Error::SpaceNotExist)?;
    memory::mut_user(user, |maybe_user| {
        let mut user_data = maybe_user.ok_or(Error::UserDoNotExist)?;
        user_data.register_referral_reward(space_index, task_id, invitee, amount);
        Ok(user_data)
    })?;

    Ok(())
}

#[update]
pub fn add_task_reward_xp(user: Principal, reward_amount: u64) -> Result<(), Error> {
    space_caller_guard()?;
    memory::mut_user(user, |maybe_user| {
        let mut user_data = maybe_user.ok_or(Error::UserDoNotExist)?;
        user_data.add_xp(reward_amount);
        Ok(user_data)
    })?;

    Ok(())
}
