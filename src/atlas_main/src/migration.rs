use crate::memory::{VMem, MEMORY_MANAGER, USERS_MAP_MEMORY_ID};
use crate::user::{Integrations, Rank, User};
use candid::Principal;
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{StableBTreeMap, Storable};
use minicbor::{Decode, Encode};
use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::BTreeMap;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, Clone)]
pub struct OldUser {
    #[n(0)]
    pub(crate) integrations: Integrations,
    #[n(1)]
    pub(crate) rank: Rank,
    #[n(2)]
    pub(crate) owned_spaces: Vec<u64>,
    #[n(3)]
    pub(crate) space_creation_in_progress: bool,
    #[n(4)]
    pub(crate) belonging_to_spaces: Vec<u64>,
}

impl Storable for OldUser {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("User encoding should always succeed");
        Cow::Owned(buf)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref())
            .unwrap_or_else(|e| panic!("failed to decode User bytes {}: {e}", hex::encode(bytes)))
    }

    const BOUND: Bound = Bound::Unbounded;
}

thread_local! {
    static OLD_USERS_MAP: RefCell<StableBTreeMap<Principal, OldUser, VMem>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MAP_MEMORY_ID)),
        )
    );
}

pub async fn migrate() {
    let old_users_data: BTreeMap<Principal, OldUser> =
        OLD_USERS_MAP.with_borrow(|users| users.iter().collect());

    let new_users_data: BTreeMap<Principal, User> = old_users_data
        .into_iter()
        .map(|(principal, old)| {
            let new_user = User {
                integrations: old.integrations,
                rank: old.rank,
                owned_spaces: old.owned_spaces,
                space_creation_in_progress: old.space_creation_in_progress,
                belonging_to_spaces: old.belonging_to_spaces,
                deci_xp_points: 0u64,
                referral_rewards: Vec::new(),
            };
            (principal, new_user)
        })
        .collect();

    OLD_USERS_MAP.with_borrow_mut(|users| {
        *users = StableBTreeMap::new(MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MAP_MEMORY_ID)))
    });

    let mut new_users_map = StableBTreeMap::<Principal, User, VMem>::new(
        MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MAP_MEMORY_ID)),
    );

    for (principal, user) in new_users_data {
        new_users_map.insert(principal, user);
    }
}
