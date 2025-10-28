use candid::Principal;
use ic_cdk::call::Call;

use crate::{errors::Error, memory};

#[inline(always)]
pub fn authenticated_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::api::msg_caller();
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
        return Ok(principal);
    }
    let is_admin = Call::bounded_wait(config.parent(), "user_is_admin")
        .with_args(&(principal,))
        .await
        .map_err(|err| Error::FailedToCallMain(err.to_string()))?
        .candid::<bool>()
        .map_err(|err| Error::FailedToParse(err.to_string()))?;

    if is_admin {
        return Ok(principal);
    }
    Err(Error::NotAdminNorOwnerNorParent)
}

#[inline(always)]
pub async fn user_is_in_space() -> Result<Principal, Error> {
    let principal = authenticated_guard()?;
    let parent = memory::read_config(|config| config.parent());
    let is_in_space = Call::bounded_wait(parent, "user_is_in_space")
        .with_args(&(principal, ic_cdk::api::canister_self()))
        .await
        .map_err(|err| Error::FailedToCallMain(err.to_string()))?
        .candid::<bool>()
        .map_err(|err| Error::FailedToParse(err.to_string()))?;

    if is_in_space {
        return Ok(principal);
    }
    Err(Error::UserDoesNotBelongToSpace)
}

#[inline(always)]
pub fn parent_guard() -> Result<Principal, Error> {
    let principal = authenticated_guard()?;
    let config = memory::read_config(|config| config.clone());
    if principal == config.parent() {
        return Ok(principal);
    }
    Err(Error::NotParent)
}
