use candid::{CandidType, Principal};
use ic_cdk::query;
use serde::Deserialize;

use crate::{
    config::Config,
    errors::Error,
    memory,
    space::{Space, SpaceType},
    user::{Rank, User},
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

#[query]
pub fn user_is_admin(user: Principal) -> bool {
    memory::get_user(&user).unwrap_or_default().rank() == &Rank::Admin
}

#[query]
pub fn user_is_in_space(user: Principal, space_id: Principal) -> bool {
    ic_cdk::println!(
        "Parent: user_is_in_space called. User: {}, Space ID: {}",
        user.to_text(),
        space_id.to_text()
    );

    let user_data = memory::get_user(&user).unwrap_or_default();
    ic_cdk::println!("Parent: User data for {}: {:?}", user.to_text(), user_data); // Wyświetl całe dane użytkownika, jeśli to możliwe

    let belonging_to_spaces = user_data.belonging_to_spaces();
    ic_cdk::println!(
        "Parent: User {} belongs to spaces (indices): {:?}",
        user.to_text(),
        belonging_to_spaces
    );

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
    let belonging_to_spaces = user.belonging_to_spaces();
    let maybe_space = memory::with_space_vec_iter(|spaces| {
        spaces.enumerate().find(|(index, space)| {
            space.space_type() == SpaceType::HUB
                && belonging_to_spaces.contains(&(*index).try_into().unwrap())
        })
    });
    if let Some((space_index, _)) = maybe_space {
        belonging_to_spaces.contains(&space_index.try_into().unwrap())
    } else {
        false
    }
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
