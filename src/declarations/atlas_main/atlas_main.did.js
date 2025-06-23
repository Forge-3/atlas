export const idlFactory = ({ IDL }) => {
  const CkUsdcLedger_1 = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const SpaceInitArg = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'owner' : IDL.Principal,
    'ckusdc_ledger' : CkUsdcLedger_1,
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'current_wasm_version' : IDL.Nat64,
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'space_description' : IDL.Text,
  });
  const SpaceArgs = IDL.Variant({
    'UpgradeArg' : IDL.Record({ 'version' : IDL.Nat64 }),
    'InitArg' : SpaceInitArg,
  });
  const UpdateConfig = IDL.Record({
    'spaces_per_space_lead' : IDL.Opt(IDL.Nat8),
    'ckusdc_ledger' : IDL.Opt(CkUsdcLedger_1),
  });
  const Config = IDL.Record({
    'spaces_per_space_lead' : IDL.Nat8,
    'ckusdc_ledger' : CkUsdcLedger_1,
    'current_space_version' : IDL.Nat64,
  });
  const AtlasArgs = IDL.Variant({
    'UpgradeArg' : IDL.Record({
      'upgrade_space_arg' : IDL.Opt(SpaceArgs),
      'config' : IDL.Opt(UpdateConfig),
    }),
    'InitArg' : Config,
  });
  const SpaceType = IDL.Variant({ 'HUB' : IDL.Null });
  const Space = IDL.Record({ 'id' : IDL.Principal, 'space_type' : SpaceType });
  const Rank = IDL.Variant({
    'SpaceLead' : IDL.Null,
    'User' : IDL.Null,
    'SuperAdmin' : IDL.Null,
    'Admin' : IDL.Null,
  });
  const Error = IDL.Variant({
    'UserRankNoMatch' : IDL.Vec(Rank),
    'FailedToCallSpace' : IDL.Record({
      'err' : IDL.Text,
      'principal' : IDL.Principal,
    }),
    'FailedToSaveSpace' : IDL.Text,
    'FailedToUpdateConfig' : IDL.Text,
    'UserRichSpaceLimit' : IDL.Record({
      'found' : IDL.Nat64,
      'expected' : IDL.Nat64,
    }),
    'UserRankToHigh' : IDL.Record({ 'found' : Rank, 'expected' : Rank }),
    'UserAlreadyHaveExpectedRank' : Rank,
    'UserNotAnOwner' : IDL.Principal,
    'CountToHigh' : IDL.Record({ 'max' : IDL.Nat64, 'found' : IDL.Nat64 }),
    'SpaceNotExist' : IDL.Null,
    'FailedToGetCanisterInfo' : IDL.Text,
    'FailedToInstallWASM' : IDL.Text,
    'UserRankToLow' : IDL.Record({ 'found' : Rank, 'expected' : Rank }),
    'FailedToInitializeCanister' : IDL.Text,
    'CreationInProgress' : IDL.Null,
    'UserDoNotExist' : IDL.Null,
    'FailedToUpdateCanisterSettings' : IDL.Text,
    'UserAlreadyIsHubMember' : IDL.Null,
    'AnonymousCaller' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : Space, 'Err' : Error });
  const GetSpacesArgs = IDL.Record({
    'count' : IDL.Nat64,
    'start' : IDL.Nat64,
  });
  const GetSpacesRes = IDL.Record({
    'spaces' : IDL.Vec(Space),
    'spaces_count' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : GetSpacesRes, 'Err' : Error });
  const GetUserBy = IDL.Variant({ 'Principal' : IDL.Principal });
  const Integrations = IDL.Record({ 'discord_id' : IDL.Opt(IDL.Text) });
  const User = IDL.Record({
    'integrations' : Integrations,
    'rank' : Rank,
    'space_creation_in_progress' : IDL.Bool,
    'belonging_to_spaces' : IDL.Vec(IDL.Nat64),
    'owned_spaces' : IDL.Vec(IDL.Nat64),
  });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error });
  const WalletReceiveResult = IDL.Record({ 'accepted' : IDL.Nat64 });
  return IDL.Service({
    'app_config' : IDL.Func([], [Config], ['query']),
    'create_new_space' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          SpaceType,
          IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
        ],
        [Result],
        [],
      ),
    'get_current_space_bytecode_version' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_space_bytecode_by_version' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        ['query'],
      ),
    'get_spaces' : IDL.Func([GetSpacesArgs], [Result_1], ['query']),
    'get_user' : IDL.Func([GetUserBy], [User], ['query']),
    'get_user_hub' : IDL.Func([IDL.Principal], [IDL.Opt(Space)], ['query']),
    'join_space' : IDL.Func([IDL.Principal], [Result_2], []),
    'set_user_admin' : IDL.Func([IDL.Principal], [Result_2], []),
    'set_user_space_lead' : IDL.Func([IDL.Principal], [Result_2], []),
    'upgrade_space' : IDL.Func([IDL.Principal], [Result_2], []),
    'user_is_admin' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'user_is_in_hub' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'user_is_in_space' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [IDL.Bool],
        ['query'],
      ),
    'wallet_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'wallet_receive' : IDL.Func([], [WalletReceiveResult], []),
  });
};
export const init = ({ IDL }) => {
  const CkUsdcLedger_1 = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const SpaceInitArg = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'owner' : IDL.Principal,
    'ckusdc_ledger' : CkUsdcLedger_1,
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'current_wasm_version' : IDL.Nat64,
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'space_description' : IDL.Text,
  });
  const SpaceArgs = IDL.Variant({
    'UpgradeArg' : IDL.Record({ 'version' : IDL.Nat64 }),
    'InitArg' : SpaceInitArg,
  });
  const UpdateConfig = IDL.Record({
    'spaces_per_space_lead' : IDL.Opt(IDL.Nat8),
    'ckusdc_ledger' : IDL.Opt(CkUsdcLedger_1),
  });
  const Config = IDL.Record({
    'spaces_per_space_lead' : IDL.Nat8,
    'ckusdc_ledger' : CkUsdcLedger_1,
    'current_space_version' : IDL.Nat64,
  });
  const AtlasArgs = IDL.Variant({
    'UpgradeArg' : IDL.Record({
      'upgrade_space_arg' : IDL.Opt(SpaceArgs),
      'config' : IDL.Opt(UpdateConfig),
    }),
    'InitArg' : Config,
  });
  return [AtlasArgs];
};
