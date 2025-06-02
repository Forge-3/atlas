use candid::Principal;
use minicbor::decode::{Decoder, Error};
use minicbor::encode::{Encoder, Write};

pub fn decode<Ctx>(d: &mut Decoder<'_>, _ctx: &mut Ctx) -> Result<Principal, Error> {
    let bytes = d.bytes()?;
    Principal::try_from_slice(bytes).map_err(|e| Error::message(e.to_string()))
}

pub fn encode<Ctx, W: Write>(
    v: &Principal,
    e: &mut Encoder<W>,
    _ctx: &mut Ctx,
) -> Result<(), minicbor::encode::Error<W::Error>> {
    e.bytes(v.as_slice())?;
    Ok(())
}

pub mod option {
    use super::*;
    use minicbor::{Decode, Encode};

    #[derive(Decode, Encode)]
    #[cbor(transparent)]
    struct CborPrincipal(#[cbor(n(0), with = "crate::cbor::principal")] pub Principal);

    pub fn decode<Ctx>(d: &mut Decoder<'_>, ctx: &mut Ctx) -> Result<Option<Principal>, Error> {
        Ok(Option::<CborPrincipal>::decode(d, ctx)?.map(|n| n.0))
    }

    pub fn encode<Ctx, W: Write>(
        v: &Option<Principal>,
        e: &mut Encoder<W>,
        ctx: &mut Ctx,
    ) -> Result<(), minicbor::encode::Error<W::Error>> {
        (*v).map(CborPrincipal).encode(e, ctx)
    }
}

pub mod b_tree_map {
    use std::collections::BTreeMap;
    use minicbor::{Decode, Encode};

    use super::*;
    
    pub fn encode<Ctx, W: Write, Value: Encode<Ctx>>(
        map: &BTreeMap<Principal, Value>,
        e: &mut Encoder<W>,
        ctx: &mut Ctx,
    ) -> Result<(), minicbor::encode::Error<W::Error>> {
        e.map(map.len() as u64)?;
        for (k, v) in map {
            e.bytes(k.as_slice())?;
            v.encode(e, ctx)?;
        }
        Ok(())
    }
    
    pub fn decode<'b, Ctx, Value>(
        d: &mut Decoder<'b>,
        ctx: &mut Ctx,
    ) -> Result<BTreeMap<Principal, Value>, Error>
    where
        Value: Decode<'b, Ctx>,
    {
        let len = d.map()?.ok_or(Error::message("Failed to get map length"))?;
        let mut map = BTreeMap::new();
        for _ in 0..len {
            let k_bytes = d.bytes()?;
            let key = Principal::from_slice(k_bytes);
            let val = Value::decode(d, ctx)?;
            map.insert(key, val);
        }
        Ok(map)
    }
}

pub mod vec {
    use super::*;

    pub fn encode<Ctx, W: Write>(
        v: &Vec<Principal>,
        e: &mut Encoder<W>,
        _ctx: &mut Ctx,
    ) -> Result<(), minicbor::encode::Error<W::Error>> {
        e.array(v.len() as u64)?;
        for principal in v {
            e.bytes(principal.as_slice())?;
        }
        Ok(())
    }

    pub fn decode<'b, Ctx>(
        d: &mut Decoder<'b>,
        _ctx: &mut Ctx,
    ) -> Result<Vec<Principal>, Error> {
        let len = d.array()?.ok_or(Error::message("Failed to get array length"))?;
        let mut vec = Vec::with_capacity(len as usize);
        for _ in 0..len {
            let bytes = d.bytes()?;
            let principal = Principal::try_from_slice(bytes)
                .map_err(|e| Error::message(e.to_string()))?;
            vec.push(principal);
        }
        Ok(vec)
    }
}