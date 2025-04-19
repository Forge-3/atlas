use std::borrow::Cow;

use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};


pub const SPACE_WASM: &[u8] =
    std::include_bytes!("../../../target/wasm32-unknown-unknown/release/atlas_space-opt.wasm.gz");
pub const SPACE_DEFAULT_CYCLES: u128 = 10_000_000_000_000;


pub async fn create_space(args: )