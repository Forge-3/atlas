use candid::Principal;
use minicbor::decode::Error;
use minicbor::encode::Write;
use minicbor::{Decode, Decoder, Encode, Encoder};
use std::collections::BTreeMap;

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
