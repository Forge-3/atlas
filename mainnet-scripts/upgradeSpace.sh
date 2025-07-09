#!/bin/bash
cp canister_ids.mainnet.json canister_ids.json
cp dfx.mainnet.json dfx.json
dfx identity use atlas-mainnet

PRINCIPAL_ID=$1

dfx canister call atlas_main upgrade_space "(principal \"$PRINCIPAL_ID\")" --network ic