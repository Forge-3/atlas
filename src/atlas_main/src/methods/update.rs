use candid::Principal;
use ic_cdk::update;
use shared::SpaceInitArg;

use crate::{
    errors::Error,
    guard::authenticated_guard,
    memory,
    space::Space,
    user::{Rank, User},
};

#[update]
pub fn set_user_space_lead(user_id: Principal) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    memory::user_rank_match(&caller, &Rank::Admin)?;

    if let Some(mut user) = memory::get_user(&user_id) {
        user.promote_to_space_lead()?;
        memory::insert_user(user_id, user);
    } else {
        memory::insert_user(user_id, User::new(Rank::SpaceLead));
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
) -> Result<Space, Error> {
    let caller = authenticated_guard()?;
    let user = memory::user_rank_match(&caller, &Rank::SpaceLead)?;
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
        admin: caller,
        space_name,
        space_description,
        space_symbol,
        space_logo,
        space_background,
        ckusdc_ledger: shared::CkUsdcLedger {
            principal: config.ckusdc_ledger.principal,
            fee: config.ckusdc_ledger.fee,
        },
    };
    let space = Space::create_space(space_init_args).await;
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
