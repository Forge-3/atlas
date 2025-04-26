export const idlFactory = ({ IDL }) => {
  const SpaceInitArg = IDL.Record({
    'admin' : IDL.Principal,
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'space_description' : IDL.Text,
  });
  const SpaceArgs = IDL.Variant({
    'UpgradeArg' : IDL.Null,
    'InitArg' : SpaceInitArg,
  });
  const State = IDL.Record({
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'space_description' : IDL.Text,
  });
  const Error = IDL.Variant({
    'NotAdminNorOwner' : IDL.Null,
    'FailedToUpdateConfig' : IDL.Text,
    'ConfigNotSet' : IDL.Null,
    'NotAdmin' : IDL.Null,
    'NotOwner' : IDL.Null,
    'AnonymousCaller' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error });
  const WalletReceiveResult = IDL.Record({ 'accepted' : IDL.Nat64 });
  return IDL.Service({
    'get_state' : IDL.Func([], [State], ['query']),
    'set_space_background' : IDL.Func([IDL.Text], [Result], []),
    'set_space_description' : IDL.Func([IDL.Text], [Result], []),
    'set_space_logo' : IDL.Func([IDL.Text], [Result], []),
    'set_space_name' : IDL.Func([IDL.Text], [Result], []),
    'wallet_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'wallet_receive' : IDL.Func([], [WalletReceiveResult], []),
  });
};
export const init = ({ IDL }) => {
  const SpaceInitArg = IDL.Record({
    'admin' : IDL.Principal,
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'space_description' : IDL.Text,
  });
  const SpaceArgs = IDL.Variant({
    'UpgradeArg' : IDL.Null,
    'InitArg' : SpaceInitArg,
  });
  return [SpaceArgs];
};
