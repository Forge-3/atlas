use std::borrow::Cow;

use candid::CandidType;
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use shared::SpaceInitArg;

#[derive(Eq, PartialEq, Debug, Decode, Encode, Default, Clone, CandidType)]
pub struct State {
    #[n(0)]
    space_logo: Option<String>,
    #[n(1)]
    space_background: Option<String>,
    #[n(2)]
    space_name: String,
    #[n(3)]
    space_description: String,
    #[n(4)]
    space_symbol: Option<String>,
    #[n(5)]
    tasks_count: u64,
}

impl State {
    pub fn set_space_name(&self, space_name: String) -> Self {
        Self {
            space_name,
            ..self.clone()
        }
    }

    pub fn set_space_description(&self, space_description: String) -> Self {
        Self {
            space_description,
            ..self.clone()
        }
    }

    pub fn set_space_logo(&self, space_logo: String) -> Self {
        Self {
            space_logo: Some(space_logo),
            ..self.clone()
        }
    }

    pub fn set_space_background(&self, space_background: String) -> Self {
        Self {
            space_background: Some(space_background),
            ..self.clone()
        }
    }

    pub fn get_next_task_id(&mut self) -> u64 {
        let next_task_id = self
            .tasks_count
            .checked_add(1)
            .expect("TaskId out of range!?");
        self.tasks_count = next_task_id;
        next_task_id
    }
}

impl From<SpaceInitArg> for State {
    fn from(init_args: SpaceInitArg) -> Self {
        Self {
            space_name: init_args.space_name,
            space_description: init_args.space_description,
            space_logo: init_args.space_logo,
            space_background: init_args.space_background,
            space_symbol: init_args.space_symbol,
            tasks_count: 0,
        }
    }
}

impl Storable for State {
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
