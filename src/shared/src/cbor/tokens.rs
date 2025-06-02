use ic_ledger_types::Tokens;
use minicbor::decode::{Decoder, Error};
use minicbor::encode::{Encoder, Write};

pub fn decode<Ctx>(d: &mut Decoder<'_>, _ctx: &mut Ctx) -> Result<Tokens, Error> {
    let e8s = d.u64()?;
    Ok(Tokens::from_e8s(e8s))
}

pub fn encode<Ctx, W: Write>(
    v: &Tokens,
    e: &mut Encoder<W>,
    _ctx: &mut Ctx,
) -> Result<(), minicbor::encode::Error<W::Error>> {
    let e8s = v.e8s();
    e.u64(e8s)?;
    Ok(())
}
