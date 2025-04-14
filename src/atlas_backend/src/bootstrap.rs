
//use atlas_backend::user::validate_caller_not_anonymous;
use ic_cdk::update;

use crate::user::validate_caller_not_anonymous;

#[update]
pub fn register_user(discord_access_token: String) {
    let principal = validate_caller_not_anonymous();

    ic_cdk::println!("{} {}", principal, discord_access_token)
}

ic_cdk::export_candid!();