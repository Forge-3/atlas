#!/bin/bash
./dev-scripts/dev.sh

dfx deploy atlas_main --argument-file dev-scripts/upgrade/atlas_main.did
dfx generate
