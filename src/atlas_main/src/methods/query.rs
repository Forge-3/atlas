use candid::{CandidType, Principal};
use ic_cdk::query;
use serde::Deserialize;

use crate::{config::Config, errors::Error, memory, space::{Space, SPACE_WASM}, user::User};

const MAX_SPACES_PER_RESPONSE: u8 = 200;

#[query]
pub fn app_config() -> Config {
    memory::read_config(|config| config.clone())
}

#[derive(Debug, CandidType, Deserialize)]
pub enum GetUserBy {
    Principal(Principal),
}

#[query]
pub fn get_user(by: GetUserBy) -> User {
    match by {
        GetUserBy::Principal(principal) => memory::get_user(&principal).unwrap_or_default(),
    }
}

#[derive(Debug, CandidType, Deserialize)]
pub struct GetSpacesArgs {
    start: usize,
    count: usize,
}

#[derive(Debug, CandidType)]
pub struct GetSpacesRes {
    pub spaces_count: usize,
    pub spaces: Vec<Space>,
}

#[query]
pub fn get_spaces(args: GetSpacesArgs) -> Result<GetSpacesRes, Error> {
    if args.count > MAX_SPACES_PER_RESPONSE as usize {
        return Err(Error::CountToHigh {
            max: MAX_SPACES_PER_RESPONSE as usize,
            found: args.count,
        });
    }

    let spaces = memory::with_space_vec_iter(|spaces| {
        spaces
            .skip(args.start)
            .take(args.count.min(MAX_SPACES_PER_RESPONSE as usize))
            .collect()
    });

    Ok(GetSpacesRes {
        spaces,
        spaces_count: memory::get_space_vec_len() as usize,
    })
}

#[query]
pub fn get_current_space_bytecode_version() -> u64 {
    memory::read_config(|config| config.current_space_version)
}

#[query]
pub fn get_space_bytecode_by_version(version: u64) -> Option<Vec<u8>> {
    memory::get_bytecode_by_version(&version)
}
