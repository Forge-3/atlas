#!/bin/bash

PRINCIPAL_ID=$1

dfx canister call atlas_main set_user_space_lead "(principal \"$PRINCIPAL_ID\")"
dfx ledger fabricate-cycles --canister atlas_main --t 1000