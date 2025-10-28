use candid::Principal;
use ic_cdk::call::Call;

use crate::memory;

pub async fn migrate_to_v4(space_id: Principal) {
    let space_index = memory::with_space_vec_iter(|spaces| {
        spaces
            .enumerate()
            .find(|(_, maybe_space)| {
                maybe_space
                    .as_ref()
                    .map(|s| s.principal() == space_id)
                    .unwrap_or(false)
            })
            .map(|(idx, _)| idx as u64)
    })
    .expect("Space do not exist");

    let (user_principal, _) = memory::with_users_iter(|mut users| {
        users.find(|(_, user_data)| user_data.owned_spaces().contains(&(space_index as u64)))
    })
    .expect("No one own this space?!");

    Call::bounded_wait(space_id, "transfer_space")
        .with_arg(user_principal)
        .await
        .expect("Failed to transfer space")
        .candid::<()>()
        .expect("Failed to read response");
}

pub async fn migrate(version: u64, space_id: Principal) {
    #[allow(clippy::single_match)]
    match version {
        4 => migrate_to_v4(space_id).await,
        _ => (),
    }
}
