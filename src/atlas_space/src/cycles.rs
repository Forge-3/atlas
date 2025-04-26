use candid::{CandidType, Nat};
use ic_cdk::{query, update};
use serde::Deserialize;

#[derive(CandidType, Deserialize, Debug)]
pub struct WalletReceiveResult {
    accepted: u64,
}

#[query]
pub fn wallet_balance() -> Nat {
    return Nat::from(ic_cdk::api::canister_balance128());
}

#[update]
pub fn wallet_receive() -> WalletReceiveResult {
    let available = ic_cdk::api::call::msg_cycles_available128();

    if available == 0 {
        return WalletReceiveResult { accepted: 0 };
    }
    let accepted = ic_cdk::api::call::msg_cycles_accept128(available);
    assert!(accepted == available);
    WalletReceiveResult {
        accepted: accepted as u64,
    }
}
