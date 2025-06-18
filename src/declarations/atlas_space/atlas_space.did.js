export const idlFactory = ({ IDL }) => {
  const CkUsdcLedger = IDL.Record({
    'fee' : IDL.Opt(IDL.Nat),
    'principal' : IDL.Principal,
  });
  const SpaceInitArg = IDL.Record({
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
    'NotAMemberOfGuild' : IDL.Null,
    'UserSubmissionNotFound' : IDL.Null,
    'FailedToUpdateConfig' : IDL.Text,
    'UserDoesNotBelongToSpace' : IDL.Null,
    'TaskAlreadyExists' : IDL.Nat64,
    'FailedToCallMain' : IDL.Text,
    'ConfigNotSet' : IDL.Null,
    'InvalidDiscordToken' : IDL.Null,
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
    'CustomError' : IDL.Text,
    'TaskDoNotExists' : IDL.Nat64,
    'AnonymousCaller' : IDL.Null,
    'SubmissionNotAccepted' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : Error });
  const TokenReward = IDL.Variant({
    'CkUsdc' : IDL.Record({ 'amount' : IDL.Nat }),
  });
  const CreateTaskType = IDL.Variant({
    'DiscordTask' : IDL.Null,
    'GenericTask' : IDL.Null,
  });
  const TaskContent = IDL.Variant({
    'Discord' : IDL.Record({
      'task_description' : IDL.Text,
      'task_title' : IDL.Text,
      'guild_id' : IDL.Text,
      'discord_invite_link' : IDL.Text,
      'guild_icon' : IDL.Opt(IDL.Text),
      'expires_at' : IDL.Opt(IDL.Text),
    }),
    'TitleAndDescription' : IDL.Record({
      'task_description' : IDL.Text,
      'task_title' : IDL.Text,
    }),
  });
  const CreateTaskArgs = IDL.Record({
    'task_title' : IDL.Text,
    'token_reward' : TokenReward,
    'task_content' : IDL.Vec(IDL.Tuple(CreateTaskType, TaskContent)),
    'number_of_uses' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : Error });
  const GetTasksArgs = IDL.Record({ 'count' : IDL.Nat64, 'start' : IDL.Nat64 });
  const SubmissionState = IDL.Variant({
    'Rejected' : IDL.Null,
    'WaitingForReview' : IDL.Null,
    'Accepted' : IDL.Null,
  });
  const Submission = IDL.Variant({
    'Text' : IDL.Record({ 'content' : IDL.Text }),
    'Discord' : IDL.Record({
      'guild_id' : IDL.Text,
      'access_token' : IDL.Text,
    }),
  });
  const SubmissionData = IDL.Record({
    'state' : SubmissionState,
    'submission' : Submission,
  });
  const TaskType = IDL.Variant({
    'DiscordTask' : IDL.Record({
      'guild_id' : IDL.Text,
      'task_content' : TaskContent,
      'discord_invite_link' : IDL.Text,
      'guild_icon' : IDL.Opt(IDL.Text),
      'expires_at' : IDL.Opt(IDL.Text),
      'submission' : IDL.Vec(IDL.Tuple(IDL.Principal, SubmissionData)),
    }),
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
    'created_at' : IDL.Nat64,
    'rewarded' : IDL.Vec(IDL.Principal),
    'number_of_uses' : IDL.Nat64,
  });
  const GetTasksRes = IDL.Record({
    'tasks' : IDL.Vec(IDL.Tuple(IDL.Nat64, Task)),
    'tasks_count' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : GetTasksRes, 'Err' : Error });
  const DiscordGuild = IDL.Record({
    'id' : IDL.Text,
    'icon' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Vec(DiscordGuild),
    'Err' : IDL.Text,
  });
  const State = IDL.Record({
    'space_symbol' : IDL.Opt(IDL.Text),
    'space_background' : IDL.Opt(IDL.Text),
    'space_logo' : IDL.Opt(IDL.Text),
    'space_name' : IDL.Text,
    'tasks_count' : IDL.Nat64,
    'space_description' : IDL.Text,
  });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponse = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponse,
  });
  const DiscordInviteApiResponse = IDL.Record({
    'code' : IDL.Text,
    'guild' : IDL.Opt(DiscordGuild),
    'expires_at' : IDL.Opt(IDL.Text),
  });
  const Result_4 = IDL.Variant({
    'Ok' : DiscordInviteApiResponse,
    'Err' : IDL.Text,
  });
  const WalletReceiveResult = IDL.Record({ 'accepted' : IDL.Nat64 });
  return IDL.Service({
    'accept_subtask_submission' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64],
        [Result],
        [],
      ),
    'create_task' : IDL.Func([CreateTaskArgs], [Result_1], []),
    'get_closed_tasks' : IDL.Func([GetTasksArgs], [Result_2], ['query']),
    'get_current_bytecode_version' : IDL.Func([], [IDL.Nat64], ['query']),
    'get_discord_guilds' : IDL.Func([IDL.Text], [Result_3], []),
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
    'transform_http_response' : IDL.Func(
        [TransformArgs],
        [HttpResponse],
        ['query'],
      ),
    'validate_discord_invite_link' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_4],
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
