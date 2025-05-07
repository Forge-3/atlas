export const idlFactory = ({ IDL }) => {
  const Config = IDL.Record({ 'spaces_per_space_lead' : IDL.Nat8 });
  const AtlasArgs = IDL.Variant({
    'UpgradeArg' : IDL.Opt(Config),
    'InitArg' : Config,
  });
  const Space = IDL.Record({ 'id' : IDL.Principal });
  const Rank = IDL.Variant({
    'SpaceLead' : IDL.Null,
    'User' : IDL.Null,
    'Admin' : IDL.Null,
  });
  const Error = IDL.Variant({
    'UserRankNoMatch' : Rank,
    'FailedToSaveSpace' : IDL.Text,
    'FailedToUpdateConfig' : IDL.Text,
    'UserRichSpaceLimit' : IDL.Record({
      'found' : IDL.Nat64,
      'expected' : IDL.Nat64,
    }),
    'UserRankToHigh' : IDL.Record({ 'found' : Rank, 'expected' : Rank }),
    'UserAlreadyHaveExpectedRank' : Rank,
    'CountToHigh' : IDL.Record({ 'max' : IDL.Nat64, 'found' : IDL.Nat64 }),
    'FailedToGetCanisterInfo' : IDL.Text,
    'FailedToInstallWASM' : IDL.Text,
    'FailedToInitializeCanister' : IDL.Text,
    'UserDoNotExist' : IDL.Null,
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
        ],
        [Result],
        [],
      ),
    'get_spaces' : IDL.Func([GetSpacesArgs], [Result_1], ['query']),
    'get_user' : IDL.Func([GetUserBy], [User], ['query']),
    'set_user_space_lead' : IDL.Func([IDL.Principal], [Result_2], []),
    'wallet_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'wallet_receive' : IDL.Func([], [WalletReceiveResult], []),
  });
};
export const init = ({ IDL }) => {
  const Config = IDL.Record({ 'spaces_per_space_lead' : IDL.Nat8 });
  const AtlasArgs = IDL.Variant({
    'UpgradeArg' : IDL.Opt(Config),
    'InitArg' : Config,
  });
  return [AtlasArgs];
};
