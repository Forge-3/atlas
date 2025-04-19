use candid::Principal;

use crate::errors::Error;

#[inline(always)]
pub fn authenticated_guard() -> Result<Principal, Error> {
    let principal = ic_cdk::caller();
    if principal == Principal::anonymous() {
        return Err(Error::AnonymousCaller)
    }
    Ok(principal)
}