cp dfx.mainnet.json dfx.json
dfx identity use atlas-mainnet

dfx deploy atlas_main --network ic --argument "
(variant {
  UpgradeArg = record {}
})"
dfx deploy atlas_frontend --network ic

dfx generate
