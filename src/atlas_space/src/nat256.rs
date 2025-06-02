use std::{
    borrow::Cow,
    fmt::{Debug, Display, Formatter},
};

use candid::{
    types::{Serializer, Type},
    CandidType, Nat,
};
use ic_stable_structures::{storable::Bound, Storable};
use minicbor::{Decode, Encode};
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};

/// A `Nat` that is guaranteed to fit in 256 bits.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, Decode, Encode)]
#[serde(try_from = "candid::Nat", into = "candid::Nat")]
pub struct Nat256(#[cbor(n(0), with = "shared::cbor::nat")] Nat);

impl Display for Nat256 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0 .0)
    }
}

impl Debug for Nat256 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0 .0)
    }
}

impl Nat256 {
    pub const ZERO: Nat256 = Nat256(Nat(BigUint::ZERO));

    pub fn into_be_bytes(self) -> [u8; 32] {
        let value_bytes = self.0 .0.to_bytes_be();
        let mut value_u256 = [0u8; 32];
        assert!(
            value_bytes.len() <= 32,
            "BUG: Nat does not fit in a U256: {:?}",
            self.0
        );
        value_u256[32 - value_bytes.len()..].copy_from_slice(&value_bytes);
        value_u256
    }

    pub fn from_be_bytes(value: [u8; 32]) -> Self {
        Self::try_from(Nat::from(BigUint::from_bytes_be(&value)))
            .expect("BUG: Nat should fit in a U256")
    }
}

impl AsRef<Nat> for Nat256 {
    fn as_ref(&self) -> &Nat {
        &self.0
    }
}

impl CandidType for Nat256 {
    fn _ty() -> Type {
        Nat::_ty()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_nat(self.as_ref())
    }
}

impl TryFrom<Nat> for Nat256 {
    type Error = String;

    fn try_from(value: Nat) -> Result<Self, Self::Error> {
        if value.0.to_bytes_le().len() > 32 {
            Err("Nat does not fit in a U256".to_string())
        } else {
            Ok(Nat256(value))
        }
    }
}

impl From<Nat256> for Nat {
    fn from(value: Nat256) -> Self {
        value.0
    }
}

macro_rules! impl_from_unchecked {
    ($f: ty, $($t: ty)*) => ($(
        impl From<$t> for $f {
            #[inline]
            fn from(v: $t) -> Self { Self::try_from(Nat::from(v)).unwrap() }
        }
    )*)
}
// all the types below are guaranteed to fit in 256 bits
impl_from_unchecked!( Nat256, usize u8 u16 u32 u64 u128 );

impl Storable for Nat256 {
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
