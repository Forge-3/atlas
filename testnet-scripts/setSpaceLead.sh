#!/bin/bash

PRINCIPAL_ID=$1

cp dfx.testnet.json dfx.json
dfx identity use atlas
dfx canister call k7v6i-lqaaa-aaaal-qsnuq-cai set_user_space_lead "(principal \"$PRINCIPAL_ID\")" --network ic
dfx identity use default