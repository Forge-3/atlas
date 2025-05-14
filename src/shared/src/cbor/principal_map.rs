use minicbor::{Encoder, Decoder};
use minicbor::encode::Write;
use minicbor::decode::Error;
use candid::Principal;
use std::collections::BTreeMap;

pub fn encode<Ctx, W: Write>(
    map: &BTreeMap<Principal, String>,
    e: &mut Encoder<W>,
    _ctx: &mut Ctx,
) -> Result<(), minicbor::encode::Error<W::Error>> {
    e.map(map.len() as u64)?;
    for (k, v) in map {
        e.bytes(k.as_slice())?;
        e.str(v)?;
    }
    Ok(())
}

pub fn decode<'b, Ctx>(
    d: &mut Decoder<'_>, _ctx: &mut Ctx
) -> Result<BTreeMap<Principal, String>, Error> {
    let len = d.map()?.ok_or(
        Error::message(
            "Failed to get map len",
        )
    )?;
    let mut map = BTreeMap::new();
    for _ in 0..len {
        let k_bytes = d.bytes()?;
        let key = Principal::from_slice(k_bytes);
        let val = d.str()?.to_string();
        map.insert(key, val);
    }
    Ok(map)
}
