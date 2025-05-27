#!/bin/bash

PRINCIPAL_ID=$1

dfx canister call ckusdc_canister icrc1_transfer "(record {
    to = record {
        owner = principal \"$PRINCIPAL_ID\"
    };
    amount = 100_000_000_000_000_000
})"