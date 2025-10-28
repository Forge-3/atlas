#!/bin/bash
./dev-scripts/dev.sh

PRINCIPAL_ID=$1

dfx canister call atlas_main get_user "(variant { Principal = principal \"$PRINCIPAL_ID\"})"