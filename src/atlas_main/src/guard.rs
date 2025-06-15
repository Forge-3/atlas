use candid::Principal;

use crate::{errors::Error, memory, user::{Rank, User}};

#[inline(always)]
pub fn authenticated_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::caller();
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
        Rank::User => Err(Error::UserRankToLow{
            expected: Rank::SpaceLead,
            found: Rank::User
        }),
        Rank::SpaceLead => Ok((principal, user)),
        Rank::Admin => Ok((principal, user)),
    }
}
