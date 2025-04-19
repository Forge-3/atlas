use candid::Principal;
use ic_cdk::update;

use crate::{
    errors::Error,
    guard::authenticated_guard,
    lifecycle::AtlasArgs,
    memory,
    user::{Rank, User},
};

#[update]
pub fn set_user_space_lead(user_id: Principal) -> Result<(), Error> {
    let caller = authenticated_guard()?;
    memory::user_rank_match(&caller, &Rank::Admin)?;

    if let Some(mut user) = memory::get_user(&user_id) {
        user.promote_to_space_lead()?;
        memory::insert_user(user_id, user);
        return Ok(());
    }

    memory::insert_user(caller, User::new(Rank::SpaceLead));
    Ok(())
}

#[update]
pub fn create_new_space() -> Result<(), Error> {
    let caller = authenticated_guard()?;
    let user = memory::user_rank_match(&caller, &Rank::SpaceLead)?;
    let spaces_per_space_lead =
        memory::read_config(|local_config| local_config.spaces_per_space_lead());

    if user.owned_spaces_count() >= spaces_per_space_lead as usize {
        return Err(Error::UserRichSpaceLimit {
            expected: spaces_per_space_lead as usize,
            found: user.owned_spaces_count(),
        });
    }

    Ok(())
}

