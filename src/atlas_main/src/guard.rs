use candid::Principal;

use crate::{
    errors::Error,
    memory,
    user::{Rank, User},
};

#[inline(always)]
pub fn authenticated_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::api::msg_caller();
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousCaller);
    }
    Ok(principal)
}

pub fn admin_or_space_lead_guard() -> Result<(Principal, User), Error> {
    let principal = authenticated_guard()?;
    let user = memory::get_user(&principal).ok_or(Error::UserDoNotExist)?;
    let rank = user.rank();
    match rank {
        Rank::User => Err(Error::UserRankToLow {
            expected: Rank::SpaceLead,
            found: Rank::User,
        }),
        Rank::SpaceLead => Ok((principal, user)),
        Rank::Admin => Ok((principal, user)),
        Rank::SuperAdmin => Ok((principal, user)),
    }
}

pub fn super_admin_guard() -> Result<Principal, Error> {
    let principal = authenticated_guard()?;
    let user = memory::get_user(&principal).ok_or(Error::UserDoNotExist)?;
    if user.rank() != &Rank::SuperAdmin {
        return Err(Error::UserRankToLow {
            expected: Rank::SuperAdmin,
            found: user.rank().clone(),
        });
    }
    Ok(principal)
}

pub fn space_caller_guard() -> Result<Principal, Error> {
    let principal = authenticated_guard()?;

    let is_space = memory::with_some_space_vec_iter(|mut spaces| {
        spaces.any(|space| space.principal() == principal)
    });

    if !is_space {
        return Err(Error::NotASpace);
    }

    Ok(principal)
}
