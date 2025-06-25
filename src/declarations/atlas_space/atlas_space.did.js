export const idlFactory = ({ IDL }) => {
  const CkUsdcLedger = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const SpaceInitArg = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'owner' : IDL.Principal,
    'ckusdc_ledger' : CkUsdcLedger,
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
  const Error = IDL.Variant({
    'BytecodeUpToDate' : IDL.Null,
    'NotParent' : IDL.Null,
    'UsageLimitExceeded' : IDL.Null,
    'UserSubmissionNotFound' : IDL.Null,
    'FailedToUpdateConfig' : IDL.Text,
    'UserDoesNotBelongToSpace' : IDL.Null,
    'TaskAlreadyExists' : IDL.Nat64,
    'FailedToCallMain' : IDL.Text,
    'ConfigNotSet' : IDL.Null,
    'UserAlreadyRewarded' : IDL.Null,
    'NotAdminNorOwnerNorParent' : IDL.Null,
    'UserAlreadySubmitted' : IDL.Null,
    'NotAdmin' : IDL.Null,
    'IncorrectSubmission' : IDL.Text,
    'CountToHigh' : IDL.Record({ 'max' : IDL.Nat64, 'found' : IDL.Nat64 }),
    'SubtaskDoNotExists' : IDL.Nat64,
    'NotOwner' : IDL.Null,
    'FailedToTransfer' : IDL.Text,
    'InvalidTaskContent' : IDL.Text,
    'TaskDoNotExists' : IDL.Nat64,
    'AnonymousCaller' : IDL.Null,
    'SubmissionNotAccepted' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error });
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
    'task_title' : IDL.Text,
    'token_reward' : TokenReward,
    'task_content' : IDL.Vec(TaskContent),
    'number_of_uses' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : Error });
  const EditSpaceArgs = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'space_description' : IDL.Text,
  });
  const GetTasksArgs = IDL.Record({ 'count' : IDL.Nat64, 'start' : IDL.Nat64 });
  const SubmissionState = IDL.Variant({
    'Rejected' : IDL.Null,
    'WaitingForReview' : IDL.Null,
    'Accepted' : IDL.Null,
  });
  const Submission = IDL.Variant({
    'Text' : IDL.Record({ 'content' : IDL.Text }),
  });
  const SubmissionData = IDL.Record({
    'state' : SubmissionState,
    'submission' : Submission,
  });
  const TaskType = IDL.Variant({
    'GenericTask' : IDL.Record({
      'task_content' : TaskContent,
      'submission' : IDL.Vec(IDL.Tuple(IDL.Principal, SubmissionData)),
    }),
  });
  const Task = IDL.Record({
    'tasks' : IDL.Vec(TaskType),
    'creator' : IDL.Principal,
    'task_title' : IDL.Text,
    'token_reward' : TokenReward,
    'rewarded' : IDL.Vec(IDL.Principal),
    'number_of_uses' : IDL.Nat64,
  });
  const GetTasksRes = IDL.Record({
    'tasks' : IDL.Vec(IDL.Tuple(IDL.Nat64, Task)),
    'tasks_count' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : GetTasksRes, 'Err' : Error });
  const State = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'tasks_count' : IDL.Nat64,
    'space_description' : IDL.Text,
  });
  const WalletReceiveResult = IDL.Record({ 'accepted' : IDL.Nat64 });
  return IDL.Service({
    'accept_subtask_submission' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64],
        [Result],
        [],
      ),
    'create_task' : IDL.Func([CreateTaskArgs], [Result_1], []),
    'edit_space' : IDL.Func([EditSpaceArgs], [Result], []),
    'get_closed_tasks' : IDL.Func([GetTasksArgs], [Result_2], ['query']),
    'get_current_bytecode_version' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_open_tasks' : IDL.Func([GetTasksArgs], [Result_2], ['query']),
    'get_state' : IDL.Func([], [State], ['query']),
    'reject_subtask_submission' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64],
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
    'wallet_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'wallet_receive' : IDL.Func([], [WalletReceiveResult], []),
    'withdraw_reward' : IDL.Func([IDL.Nat64], [Result], []),
  });
};
export const init = ({ IDL }) => {
  const CkUsdcLedger = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const SpaceInitArg = IDL.Record({
    'external_links' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'owner' : IDL.Principal,
    'ckusdc_ledger' : CkUsdcLedger,
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
