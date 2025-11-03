import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AnswerFormat = { 'Small' : null } |
  { 'List' : null } |
  { 'Long' : null } |
  { 'Paragraph' : null };
export interface CkUsdcLedger { 'fee' : [] | [bigint], 'principal' : Principal }
export interface CkUsdcLedger_1 {
  'fee' : [] | [bigint],
  'principal' : Principal,
}
export interface ClosedTask {
  'tasks' : Array<TaskType>,
  'creator' : Principal,
  'task_title' : string,
  'refunded' : boolean,
  'token_reward' : TokenReward,
  'end_time' : bigint,
  'start_time' : bigint,
  'rewarded' : Array<Principal>,
  'number_of_uses' : bigint,
}
export interface Config {
  'owner' : Principal,
  'ckusdc_ledger' : CkUsdcLedger,
  'current_wasm_version' : bigint,
  'parent' : Principal,
}
export interface CreateTaskArgs {
  'task_title' : string,
  'token_reward' : TokenReward,
  'end_time' : bigint,
  'task_content' : Array<TaskContent>,
  'start_time' : bigint,
  'number_of_uses' : bigint,
}
export interface EditSpaceArgs {
  'external_links' : Array<[string, string]>,
  'space_background' : [] | [string],
  'space_logo' : [] | [string],
  'space_name' : string,
  'space_description' : string,
}
export interface EditTaskArgs {
  'task_id' : bigint,
  'task_title' : [] | [string],
  'token_reward' : [] | [TokenReward],
  'end_time' : [] | [bigint],
  'task_content' : [] | [Array<[] | [TaskContent]>],
  'start_time' : [] | [bigint],
  'number_of_uses' : [] | [bigint],
}
export type Error = { 'BytecodeUpToDate' : null } |
  { 'NotTaskCreator' : null } |
  { 'NotParent' : null } |
  { 'UsageLimitExceeded' : null } |
  { 'FailedToQueryBalance' : string } |
  { 'UserSubmissionNotFound' : null } |
  { 'FailedToUpdateConfig' : string } |
  { 'UserDoesNotBelongToSpace' : null } |
  { 'TaskNotActive' : null } |
  { 'AllRewardsClaimed' : null } |
  { 'TaskAlreadyExists' : bigint } |
  { 'FailedToCallMain' : string } |
  { 'ConfigNotSet' : null } |
  { 'UserAlreadyRewarded' : null } |
  { 'TaskNotFound' : bigint } |
  { 'FailedToClaimRewards' : Array<[bigint, Error]> } |
  { 'NotAdminNorOwnerNorParent' : null } |
  { 'UserAlreadySubmitted' : null } |
  { 'BalanceInconsistency' : string } |
  { 'RewardAlreadyRefunded' : null } |
  { 'NotAdmin' : null } |
  { 'IncorrectSubmission' : string } |
  { 'CountToHigh' : { 'max' : bigint, 'found' : bigint } } |
  { 'SubtaskDoNotExists' : bigint } |
  { 'NotOwner' : null } |
  { 'FailedToTransfer' : string } |
  { 'TaskExpired' : null } |
  { 'FailedToParse' : string } |
  { 'InvalidTaskContent' : string } |
  { 'TaskDoNotExists' : bigint } |
  { 'AnonymousCaller' : null } |
  { 'SubmissionNotAccepted' : null };
export interface GetClosedTasksRes {
  'tasks' : Array<[bigint, ClosedTask]>,
  'tasks_count' : bigint,
}
export interface GetTasksArgs { 'count' : bigint, 'start' : bigint }
export interface GetTasksRes {
  'tasks' : Array<[bigint, Task]>,
  'tasks_count' : bigint,
}
export type Result = { 'Ok' : null } |
  { 'Err' : Error };
export type Result_1 = { 'Ok' : null } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : bigint } |
  { 'Err' : Error };
export type Result_3 = { 'Ok' : string } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : GetClosedTasksRes } |
  { 'Err' : Error };
export type Result_5 = { 'Ok' : GetTasksRes } |
  { 'Err' : Error };
export type SpaceArgs = { 'UpgradeArg' : { 'version' : bigint } } |
  { 'InitArg' : SpaceInitArg };
export interface SpaceInfo { 'version' : bigint, 'state' : State }
export interface SpaceInitArg {
  'external_links' : Array<[string, string]>,
  'owner' : Principal,
  'ckusdc_ledger' : CkUsdcLedger_1,
  'space_symbol' : [] | [string],
  'space_background' : [] | [string],
  'current_wasm_version' : bigint,
  'space_logo' : [] | [string],
  'space_name' : string,
  'space_description' : string,
}
export interface State {
  'external_links' : Array<[string, string]>,
  'space_symbol' : [] | [string],
  'space_background' : [] | [string],
  'space_logo' : [] | [string],
  'space_name' : string,
  'tasks_count' : bigint,
  'space_description' : string,
}
export type Submission = { 'Empty' : null } |
  { 'List' : { 'items' : Array<string> } } |
  { 'Text' : { 'content' : string } } |
  { 'Discord' : { 'username' : string, 'user_id' : bigint } } |
  {
    'Twitter' : {
      'created_at' : string,
      'x_user_id' : bigint,
      'x_username' : string,
      'x_name' : string,
    }
  };
export interface SubmissionData {
  'state' : SubmissionState,
  'rejection_reason' : [] | [string],
  'submission' : Submission,
}
export type SubmissionState = { 'Rejected' : null } |
  { 'WaitingForReview' : null } |
  { 'Accepted' : null };
export interface Task {
  'timer_id' : [] | [bigint],
  'tasks' : Array<TaskType>,
  'creator' : Principal,
  'task_title' : string,
  'token_reward' : TokenReward,
  'end_time' : bigint,
  'start_time' : bigint,
  'rewarded' : Array<Principal>,
  'number_of_uses' : bigint,
}
export type TaskContent = {
    'TwitterTask' : {
      'task_description' : string,
      'task_title' : string,
      'x_post_link' : string,
      'allow_resubmit' : boolean,
    }
  } |
  {
    'DiscordTask' : {
      'task_description' : string,
      'task_title' : string,
      'invite_link' : string,
      'guild_id' : string,
      'allow_resubmit' : boolean,
    }
  } |
  {
    'TitleAndDescription' : {
      'answer_format' : AnswerFormat,
      'task_description' : string,
      'task_title' : string,
      'allow_resubmit' : boolean,
    }
  };
export type TaskType = {
    'TwitterTask' : {
      'task_content' : TaskContent,
      'submission' : Array<[Principal, SubmissionData]>,
    }
  } |
  {
    'DiscordTask' : {
      'task_content' : TaskContent,
      'submission' : Array<[Principal, SubmissionData]>,
    }
  } |
  {
    'GenericTask' : {
      'task_content' : TaskContent,
      'submission' : Array<[Principal, SubmissionData]>,
    }
  };
export type TokenReward = { 'CkUsdc' : { 'amount' : bigint } };
export interface WalletReceiveResult { 'accepted' : bigint }
export interface _SERVICE {
  'accept_subtask_submission' : ActorMethod<
    [Principal, bigint, bigint],
    Result
  >,
  'clean_up_space_before_deletion' : ActorMethod<[], Result_1>,
  'close_task' : ActorMethod<[bigint], Result>,
  'create_task' : ActorMethod<[CreateTaskArgs], Result_2>,
  'delete_closed_task' : ActorMethod<[bigint], Result>,
  'edit_space' : ActorMethod<[EditSpaceArgs], Result>,
  'edit_task' : ActorMethod<[EditTaskArgs], Result>,
  'exchange_code_for_token' : ActorMethod<[string, string], Result_3>,
  'fetch_x_post_likes' : ActorMethod<[string, string], Result_2>,
  'fetch_x_user_info' : ActorMethod<[string], Result_3>,
  'force_expire_task' : ActorMethod<[bigint], Result>,
  'get_closed_tasks' : ActorMethod<[GetTasksArgs], Result_4>,
  'get_config' : ActorMethod<[], Config>,
  'get_current_bytecode_version' : ActorMethod<[], bigint>,
  'get_expired_tasks' : ActorMethod<[GetTasksArgs], Result_5>,
  'get_open_tasks' : ActorMethod<[GetTasksArgs], Result_5>,
  'get_space_info' : ActorMethod<[], SpaceInfo>,
  'get_state' : ActorMethod<[], State>,
  'reject_subtask_submission' : ActorMethod<
    [Principal, bigint, bigint, [] | [string]],
    Result
  >,
  'set_space_background' : ActorMethod<[string], Result>,
  'set_space_description' : ActorMethod<[string], Result>,
  'set_space_logo' : ActorMethod<[string], Result>,
  'set_space_name' : ActorMethod<[string], Result>,
  'submit_subtask_submission' : ActorMethod<
    [bigint, bigint, Submission],
    Result
  >,
  'transfer_space' : ActorMethod<[Principal], undefined>,
  'wallet_balance' : ActorMethod<[], bigint>,
  'wallet_receive' : ActorMethod<[], WalletReceiveResult>,
  'withdraw_reward' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
