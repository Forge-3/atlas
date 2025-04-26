
dfx ledger fabricate-cycles --canister atlas_main
dfx canister call atlas_main set_user_space_lead '(principal "hul5x-6nwfx-kvemo-yh63a-tykc6-hvjfu-e4bja-kkark-nbqw4-nnofw-qae")'
dfx canister call atlas_main get_user '(principal "ogxac-f4uay-l5nc4-dth55-ubkk6-ulcjz-3i643-y2hwa-3cicp-gtbur-qae")'