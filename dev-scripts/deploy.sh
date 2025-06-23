cp dfx.dev.json dfx.json
dfx deploy atlas_main --argument-file dev-scripts/deploy/atlas_main.did
dfx deploy internet_identity

export DEFAULT_PRINCIPAL=$(dfx identity get-principal)
dfx deploy ckusdc_ledger_canister --argument "
  (variant {
    Init = record {
      metadata = vec {};
      initial_balances = vec {
        record {
          record {
            owner = principal \"$DEFAULT_PRINCIPAL\"
          };
          100_000_000_000_000_000 ;
        };
    };
      minting_account = record {
        owner = principal \"$DEFAULT_PRINCIPAL\"
      };
      send_whitelist = vec {};
      transfer_fee =  10_000;
      token_symbol = \"LckUSDC\";
      token_name = \"Local ckUSDC\";
      archive_options = record {
        num_blocks_to_archive = 100000;
        trigger_threshold = 100000;
        controller_id = principal \"$DEFAULT_PRINCIPAL\";
    };
    decimals = opt 6
    }
  })
"
dfx deploy ckusdc_index_canister --argument "
 (opt variant {
  Init = record { 
    ledger_id = principal \"xevnm-gaaaa-aaaar-qafnq-cai\";
    retrieve_blocks_from_ledger_interval_seconds = opt 10 
  }
})
"

dfx generate
