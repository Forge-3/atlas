use candid::Principal;

use crate::{errors::Error, memory};

#[inline(always)]
pub fn authenticated_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousCaller)
    }
    Ok(principal)
}

#[inline(always)]
pub fn owner_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousCaller)
    }
    let config = memory::read_config(|config| {
        config.clone().ok_or(Error::ConfigNotSet)
    })?;
    if principal != config.owner() {
        return Err(Error::NotOwner)
    }
    Ok(principal)
}

#[inline(always)]
pub fn admin_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousCaller)
    }
    let config = memory::read_config(|config| {
        config.clone().ok_or(Error::ConfigNotSet)
    })?;
    if principal != config.admin() {
        return Err(Error::NotAdmin)
    }
    Ok(principal)
}

#[inline(always)]
pub fn admin_or_owner_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousCaller)
    }
    let config = memory::read_config(|config| {
        config.clone().ok_or(Error::ConfigNotSet)
    })?;
    if principal != config.admin() && principal != config.owner() {
        return Err(Error::NotAdminNorOwner)
    }
    Ok(principal)
}