#!/bin/bash

PRINCIPAL_ID=$1

dfx canister call atlas_main unlock_space_creation "(principal \"$PRINCIPAL_ID\")"