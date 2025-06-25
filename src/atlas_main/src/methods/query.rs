use candid::{CandidType, Principal};
use ic_cdk::query;
use serde::Deserialize;

use crate::{
    config::Config,
    errors::Error,
    memory,
    space::{Space, SpaceType},
    user::{Integrations, Rank},
};

const MAX_SPACES_PER_RESPONSE: u8 = 200;

#[query]
pub fn app_config() -> Config {
    memory::read_config(|config| config.clone())
}

#[derive(Debug, CandidType, Deserialize)]
pub enum GetUserBy {
    Principal(Principal),
}

#[derive(CandidType)]
pub struct CandidUser {
    pub(crate) integrations: Integrations,
    pub(crate) rank: Rank,
    pub(crate) space_creation_in_progress: bool,
    pub(crate) owned_spaces: Vec<Space>,
    pub(crate) belonging_to_spaces: Vec<Space>,
    pub(crate) in_hub: Option<Space>,
}

#[query]
pub fn get_user(by: GetUserBy) -> CandidUser {
    let user = match by {
        GetUserBy::Principal(principal) => memory::get_user(&principal).unwrap_or_default(),
    };
    let owned_spaces: Vec<_> = user
        .owned_spaces()
        .iter()
        .map(|space_index| memory::get_space(*space_index).expect("Space do not exist?!"))
        .collect();
    let belonging_to_spaces: Vec<_> = user
        .belonging_to_spaces()
        .iter()
        .map(|space_index| memory::get_space(*space_index).expect("Space do not exist?!"))
        .collect();

    let in_hub = belonging_to_spaces
        .iter()
        .find(|space| space.space_type() == SpaceType::HUB)
        .cloned();

    CandidUser {
        integrations: user.integrations,
        rank: user.rank,
        space_creation_in_progress: user.space_creation_in_progress,
        owned_spaces,
        belonging_to_spaces,
        in_hub,
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

#[query]
pub fn user_is_admin(user: Principal) -> bool {
    memory::get_user(&user).unwrap_or_default().rank() == &Rank::Admin
}

#[query]
pub fn user_is_in_space(user: Principal, space_id: Principal) -> bool {
    let user = memory::get_user(&user).unwrap_or_default();
    let belonging_to_spaces = user.belonging_to_spaces();
    let (space_index, _) = memory::with_space_vec_iter(|spaces| {
        spaces
            .enumerate()
            .find(|(_, space)| space.principal() == space_id)
    })
    .expect("Space do not exist");
    belonging_to_spaces.contains(&space_index.try_into().unwrap())
}

#[query]
pub fn user_is_in_hub(user: Principal) -> bool {
    let user = memory::get_user(&user).unwrap_or_default();

    user.belonging_to_spaces()
        .iter()
        .map(|space_index| memory::get_space(*space_index).expect("Space do not exist?!"))
        .find(|space| space.space_type() == SpaceType::HUB)
        .is_some()
}

#[query]
pub fn get_user_hub(user: Principal) -> Option<Space> {
    let user = memory::get_user(&user).unwrap_or_default();
    let belonging_to_spaces = user.belonging_to_spaces();
    let maybe_space = memory::with_space_vec_iter(|spaces| {
        spaces.enumerate().find(|(index, space)| {
            space.space_type() == SpaceType::HUB
                && belonging_to_spaces.contains(&(*index).try_into().unwrap())
        })
    });
    if let Some((_, space)) = maybe_space {
        return Some(space);
    }
    None
}
