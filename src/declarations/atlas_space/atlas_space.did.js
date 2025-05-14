export const idlFactory = ({ IDL }) => {
  const CkUsdcLedger = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const SpaceInitArg = IDL.Record({
    'admin' : IDL.Principal,
    'ckusdc_ledger' : CkUsdcLedger,
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
  const TokenReward = IDL.Variant({
    'CkUsdc' : IDL.Record({ 'amount' : IDL.Nat }),
  });
  const TaskContent = IDL.Variant({
    'TitleAndDescription' : IDL.Record({
      'task_description' : IDL.Text,
      'task_title' : IDL.Text,
    }),
  });
  const CreateTaskArgs = IDL.Record({
    'token_reward' : TokenReward,
    'task_content' : TaskContent,
    'number_of_uses' : IDL.Nat64,
  });
  const Error = IDL.Variant({
    'NotAdminNorOwner' : IDL.Null,
    'FailedToUpdateConfig' : IDL.Text,
    'TaskAlreadyExists' : IDL.Nat64,
    'ConfigNotSet' : IDL.Null,
    'NotAdmin' : IDL.Null,
    'NotOwner' : IDL.Null,
    'FailedToTransfer' : IDL.Text,
    'AnonymousCaller' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error });
  const State = IDL.Record({
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'tasks_count' : IDL.Nat64,
    'space_description' : IDL.Text,
  });
  const WalletReceiveResult = IDL.Record({ 'accepted' : IDL.Nat64 });
  return IDL.Service({
    'create_task' : IDL.Func([CreateTaskArgs], [Result], []),
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
  const CkUsdcLedger = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const SpaceInitArg = IDL.Record({
    'admin' : IDL.Principal,
    'ckusdc_ledger' : CkUsdcLedger,
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
