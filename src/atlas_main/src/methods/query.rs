use candid::Principal;
use ic_cdk::query;

use crate::{config::Config, memory, user::User};

#[query]
pub fn app_config() -> Config {
    memory::read_config(|config| config.clone())
}

#[query]
pub fn get_user(user_id: Principal) -> User {
    memory::get_user(&user_id).unwrap_or_default()
}
