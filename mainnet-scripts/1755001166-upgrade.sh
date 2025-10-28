./mainnet-scripts/main.sh 

dfx deploy atlas_main --network ic --argument "
(variant {
  UpgradeArg = record {}
})"
dfx deploy atlas_frontend --network ic

dfx generate
