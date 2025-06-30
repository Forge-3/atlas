cp dfx.mainnet.json dfx.json
dfx identity use atlas-mainnet

dfx deploy atlas_main --network ic --argument-file dev-scripts/deploy/atlas_main.did
dfx deploy atlas_frontend --network ic


dfx generate
