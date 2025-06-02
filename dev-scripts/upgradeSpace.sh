#!/bin/bash

PRINCIPAL_ID=$1

dfx canister call atlas_main upgrade_space "(record {
    id = principal \"$PRINCIPAL_ID\"
})"