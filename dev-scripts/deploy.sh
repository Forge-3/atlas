dfx deploy atlas_main --argument-file dev-scripts/deploy/atlas_main.did
dfx deploy internet_identity

export DEFAULT_ACCOUNT_ID=$(dfx ledger account-id)
dfx deploy ckusdc_canister --argument "
  (variant {
    Init = record {
      initial_values = vec {
        record {
          \"$DEFAULT_ACCOUNT_ID\";
          record { e8s = 100_000_000_000_000_000 : nat64; };
        };
    };
      minting_account = \"$DEFAULT_ACCOUNT_ID\";
      send_whitelist = vec {};
      transfer_fee = opt record { e8s = 10_000 : nat64; };
      token_symbol = opt \"LckUSDC\";
      token_name = opt \"Local ckUSDC\";
    }
  })
"

dfx generate
