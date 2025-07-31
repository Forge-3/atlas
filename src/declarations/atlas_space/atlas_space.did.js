export const idlFactory = ({ IDL }) => {
  const Error = IDL.Rec();
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
  Error.fill(
    IDL.Variant({
      'BytecodeUpToDate' : IDL.Null,
      'NotTaskCreator' : IDL.Null,
      'NotParent' : IDL.Null,
      'UsageLimitExceeded' : IDL.Null,
      'FailedToQueryBalance' : IDL.Text,
      'UserSubmissionNotFound' : IDL.Null,
      'FailedToUpdateConfig' : IDL.Text,
      'UserDoesNotBelongToSpace' : IDL.Null,
      'TaskNotActive' : IDL.Null,
      'AllRewardsClaimed' : IDL.Null,
      'TaskAlreadyExists' : IDL.Nat64,
      'FailedToCallMain' : IDL.Text,
      'ConfigNotSet' : IDL.Null,
      'UserAlreadyRewarded' : IDL.Null,
      'TaskNotFound' : IDL.Nat64,
      'FailedToClaimRewards' : IDL.Vec(IDL.Tuple(IDL.Nat64, Error)),
      'NotAdminNorOwnerNorParent' : IDL.Null,
      'UserAlreadySubmitted' : IDL.Null,
      'BalanceInconsistency' : IDL.Text,
      'RewardAlreadyRefunded' : IDL.Null,
      'NotAdmin' : IDL.Null,
      'IncorrectSubmission' : IDL.Text,
      'CountToHigh' : IDL.Record({ 'max' : IDL.Nat64, 'found' : IDL.Nat64 }),
      'SubtaskDoNotExists' : IDL.Nat64,
      'NotOwner' : IDL.Null,
      'FailedToTransfer' : IDL.Text,
      'TaskExpired' : IDL.Null,
      'FailedToParse' : IDL.Text,
      'InvalidTaskContent' : IDL.Text,
      'TaskDoNotExists' : IDL.Nat64,
      'AnonymousCaller' : IDL.Null,
      'SubmissionNotAccepted' : IDL.Null,
    })
  );
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const TokenReward = IDL.Variant({
    'CkUsdc' : IDL.Record({ 'amount' : IDL.Nat }),
  });
  const TaskContent = IDL.Variant({
    'TitleAndDescription' : IDL.Record({
      'task_description' : IDL.Text,
      'task_title' : IDL.Text,
      'allow_resubmit' : IDL.Bool,
    }),
  });
  const CreateTaskArgs = IDL.Record({
    'task_title' : IDL.Text,
    'token_reward' : TokenReward,
    'end_time' : IDL.Nat64,
    'task_content' : IDL.Vec(TaskContent),
    'start_time' : IDL.Nat64,
    'number_of_uses' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : Error });
  const EditSpaceArgs = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'space_description' : IDL.Text,
  });
  const EditTaskArgs = IDL.Record({
    'task_id' : IDL.Nat64,
    'task_title' : IDL.Opt(IDL.Text),
    'token_reward' : IDL.Opt(TokenReward),
    'end_time' : IDL.Opt(IDL.Nat64),
    'task_content' : IDL.Opt(IDL.Vec(IDL.Opt(TaskContent))),
    'start_time' : IDL.Opt(IDL.Nat64),
    'number_of_uses' : IDL.Opt(IDL.Nat64),
  });
  const GetTasksArgs = IDL.Record({ 'count' : IDL.Nat64, 'start' : IDL.Nat64 });
  const SubmissionState = IDL.Variant({
    'Rejected' : IDL.Null,
    'WaitingForReview' : IDL.Null,
    'Accepted' : IDL.Null,
  });
  const Submission = IDL.Variant({
    'Empty' : IDL.Null,
    'Text' : IDL.Record({ 'content' : IDL.Text }),
  });
  const SubmissionData = IDL.Record({
    'state' : SubmissionState,
    'rejection_reason' : IDL.Opt(IDL.Text),
    'submission' : Submission,
  });
  const TaskType = IDL.Variant({
    'GenericTask' : IDL.Record({
      'task_content' : TaskContent,
      'submission' : IDL.Vec(IDL.Tuple(IDL.Principal, SubmissionData)),
    }),
  });
  const ClosedTask = IDL.Record({
    'tasks' : IDL.Vec(TaskType),
    'creator' : IDL.Principal,
    'task_title' : IDL.Text,
    'refunded' : IDL.Bool,
    'token_reward' : TokenReward,
    'end_time' : IDL.Nat64,
    'start_time' : IDL.Nat64,
    'rewarded' : IDL.Vec(IDL.Principal),
    'number_of_uses' : IDL.Nat64,
  });
  const GetClosedTasksRes = IDL.Record({
    'tasks' : IDL.Vec(IDL.Tuple(IDL.Nat64, ClosedTask)),
    'tasks_count' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({ 'Ok' : GetClosedTasksRes, 'Err' : Error });
  const CkUsdcLedger = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const Config = IDL.Record({
    'owner' : IDL.Principal,
    'ckusdc_ledger' : CkUsdcLedger,
    'current_wasm_version' : IDL.Nat64,
    'parent' : IDL.Principal,
  });
  const Task = IDL.Record({
    'timer_id' : IDL.Opt(IDL.Nat64),
    'tasks' : IDL.Vec(TaskType),
    'creator' : IDL.Principal,
    'task_title' : IDL.Text,
    'token_reward' : TokenReward,
    'end_time' : IDL.Nat64,
    'start_time' : IDL.Nat64,
    'rewarded' : IDL.Vec(IDL.Principal),
    'number_of_uses' : IDL.Nat64,
  });
  const GetTasksRes = IDL.Record({
    'tasks' : IDL.Vec(IDL.Tuple(IDL.Nat64, Task)),
    'tasks_count' : IDL.Nat64,
  });
  const Result_4 = IDL.Variant({ 'Ok' : GetTasksRes, 'Err' : Error });
  const State = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'tasks_count' : IDL.Nat64,
    'space_description' : IDL.Text,
  });
  const SpaceInfo = IDL.Record({ 'version' : IDL.Nat64, 'state' : State });
  const WalletReceiveResult = IDL.Record({ 'accepted' : IDL.Nat64 });
  return IDL.Service({
    'accept_subtask_submission' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64],
        [Result],
        [],
      ),
    'clean_up_space_before_deletion' : IDL.Func([], [Result_1], []),
    'create_task' : IDL.Func([CreateTaskArgs], [Result_2], []),
    'delete_closed_task' : IDL.Func([IDL.Nat64], [Result], []),
    'edit_space' : IDL.Func([EditSpaceArgs], [Result], []),
    'edit_task' : IDL.Func([EditTaskArgs], [Result], []),
    'force_close_task' : IDL.Func([IDL.Nat64], [Result], []),
    'get_closed_tasks' : IDL.Func([GetTasksArgs], [Result_3], ['query']),
    'get_config' : IDL.Func([], [Config], ['query']),
    'get_current_bytecode_version' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_open_tasks' : IDL.Func([GetTasksArgs], [Result_4], ['query']),
    'get_space_info' : IDL.Func([], [SpaceInfo], ['query']),
    'get_state' : IDL.Func([], [State], ['query']),
    'reject_subtask_submission' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64, IDL.Opt(IDL.Text)],
        [Result],
        [],
      ),
    'set_space_background' : IDL.Func([IDL.Text], [Result], []),
    'set_space_description' : IDL.Func([IDL.Text], [Result], []),
    'set_space_logo' : IDL.Func([IDL.Text], [Result], []),
    'set_space_name' : IDL.Func([IDL.Text], [Result], []),
    'submit_subtask_submission' : IDL.Func(
        [IDL.Nat64, IDL.Nat64, Submission],
        [Result],
        [],
      ),
    'transfer_space' : IDL.Func([IDL.Principal], [], []),
    'wallet_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'wallet_receive' : IDL.Func([], [WalletReceiveResult], []),
    'withdraw_reward' : IDL.Func([IDL.Nat64], [Result], []),
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
  return [SpaceArgs];
};
