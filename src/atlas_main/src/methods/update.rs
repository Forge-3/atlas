use candid::{Encode, Principal};
use ic_cdk::{
    api::management_canister::main::{CanisterInstallMode, InstallCodeArgument},
    update,
};
use shared::{SpaceArgs, SpaceInitArg};

use crate::{
    errors::Error,
    guard::{admin_or_space_lead_guard, authenticated_guard},
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
) -> Result<Space, Error> {
    let caller = authenticated_guard()?;
    let user = memory::user_rank_match(&caller, &[Rank::SpaceLead])?;
    let config = memory::read_config(|local_config| local_config.clone());

    if user.owned_spaces_count() >= config.spaces_per_space_lead as usize {
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
    };
    let space = Space::create_space(space_init_args, space_type).await;
    memory::mut_user(caller, |maybe_user| {
        let mut user = maybe_user.expect("User do not exist?!");
        user.set_space_creation(false);
        Ok(user)
    })?;
    let space = space?;

    memory::push_space(&space)?;
    memory::mut_user(caller, |maybe_user| {
        let mut user = maybe_user.expect("User do not exist?!");
        let space_index = memory::get_space_vec_len()
            .checked_sub(1)
            .expect("Space vector is empty!?");
        user.push_space(space_index);
        Ok(user)
    })?;

    Ok(space)
}

#[update]
pub async fn upgrade_space(space_id: Space) -> Result<(), Error> {
    let (_, user) = admin_or_space_lead_guard()?;
    if user.rank() == &Rank::SpaceLead {
        let owned_spaces: Vec<_> = user
            .owned_spaces()
            .iter()
            .filter_map(|&i| memory::get_space(i))
            .collect();

        if !owned_spaces.contains(&space_id) {
            return Err(Error::UserNotAnOwner(space_id));
        }
    }

    let current_bytecode_version = super::query::get_current_space_bytecode_version();
    let current_space_bytecode_version =
        ic_cdk::call::<((),), (u64,)>(space_id.principal(), "get_current_bytecode_version", ((),))
            .await
            .map_err(|err| Error::FailedToCallSpace {
                err: format!("{:?}", err),
                principal: space_id.principal(),
            })?
            .0;

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
        let args = InstallCodeArgument {
            mode: CanisterInstallMode::Upgrade(None),
            canister_id: space_id.principal(),
            wasm_module: next_bytecode,
            arg: Encode!(&arg).expect("Failed to decode args"),
        };
        ic_cdk::api::management_canister::main::install_code(args)
            .await
            .unwrap();
        ic_cdk::println!(
            "Successfully upgraded {} to version {}",
            ic_cdk::id(),
            version
        );
    }

    Ok(())
}

#[update]
pub fn join_space(space_id: Principal) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    let (index, space) = memory::with_space_vec_iter(|spaces| {
        spaces
            .enumerate()
            .find(|(_, space)| space.principal() == space_id)
    })
    .ok_or(Error::SpaceNotExist)?;

    if space.space_type() == SpaceType::HUB {
        let user = memory::get_user(&caller).unwrap_or_default();
        let is_hub_member = user.belonging_to_spaces().iter().any(|space_index| {
            memory::get_space(*space_index)
                .expect("Space do  not exist?!")
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
