use candid::Principal;

use crate::{errors::Error, memory};

#[inline(always)]
pub fn authenticated_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousCaller);
    }
    Ok(principal)
}

#[inline(always)]
pub async fn parent_or_owner_or_admin_guard() -> Result<Principal, Error> {
    let principal = authenticated_guard()?;
    let config = memory::read_config(|config| config.clone());
    if principal == config.parent() || principal == config.owner() {
        return Ok(principal)
    }
    let is_admin = ic_cdk::call::<(Principal,), (bool,)>(
        config.parent(),
        "user_is_admin",
        (principal,),
    ).await.map_err(|err| Error::FailedToCallMain(format!("{:?}", err)))?.0;
    if is_admin {
        return Ok(principal)
    }
    Err(Error::NotAdminNorOwnerNorParent)
}

#[inline(always)]
pub async fn user_is_in_space() -> Result<Principal, Error> {
    let principal = authenticated_guard()?;
    let parent = memory::read_config(|config| config.parent().clone());
    let is_in_space = ic_cdk::call::<(Principal,Principal,), (bool,)>(
        parent,
        "user_is_in_space",
        (principal, ic_cdk::id(),),
    ).await.map_err(|err| Error::FailedToCallMain(format!("{:?}", err)))?.0;
    if is_in_space {
        return Ok(principal)
    }
    Err(Error::UserDoesNotBelongToSpace)
}