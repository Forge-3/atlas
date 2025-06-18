import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CkUsdcLedger { 'fee' : [] | [bigint], 'principal' : Principal }
export interface CreateTaskArgs {
  'task_title' : string,
  'token_reward' : TokenReward,
  'task_content' : Array<[CreateTaskType, TaskContent]>,
  'number_of_uses' : bigint,
}
export type CreateTaskType = { 'DiscordTask' : null } |
  { 'GenericTask' : null };
export interface DiscordGuild {
  'id' : string,
  'icon' : [] | [string],
  'name' : string,
}
export interface DiscordInviteApiResponse {
  'code' : string,
  'guild' : [] | [DiscordGuild],
  'expires_at' : [] | [string],
}
export type Error = { 'BytecodeUpToDate' : null } |
  { 'NotParent' : null } |
  { 'UsageLimitExceeded' : null } |
  { 'NotAMemberOfGuild' : null } |
  { 'UserSubmissionNotFound' : null } |
  { 'FailedToUpdateConfig' : string } |
  { 'UserDoesNotBelongToSpace' : null } |
  { 'TaskAlreadyExists' : bigint } |
  { 'FailedToCallMain' : string } |
  { 'ConfigNotSet' : null } |
  { 'InvalidDiscordToken' : null } |
  { 'UserAlreadyRewarded' : null } |
  { 'NotAdminNorOwnerNorParent' : null } |
  { 'UserAlreadySubmitted' : null } |
  { 'NotAdmin' : null } |
  { 'IncorrectSubmission' : string } |
  { 'CountToHigh' : { 'max' : bigint, 'found' : bigint } } |
  { 'SubtaskDoNotExists' : bigint } |
  { 'NotOwner' : null } |
  { 'FailedToTransfer' : string } |
  { 'InvalidTaskContent' : string } |
  { 'CustomError' : string } |
  { 'TaskDoNotExists' : bigint } |
  { 'AnonymousCaller' : null } |
  { 'SubmissionNotAccepted' : null };
export interface GetTasksArgs { 'count' : bigint, 'start' : bigint }
export interface GetTasksRes {
  'tasks' : Array<[bigint, Task]>,
  'tasks_count' : bigint,
}
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export type Result = { 'Ok' : null } |
  { 'Err' : Error };
export type Result_1 = { 'Ok' : bigint } |
  { 'Err' : Error };
export type Result_2 = { 'Ok' : GetTasksRes } |
  { 'Err' : Error };
export type Result_3 = { 'Ok' : Array<DiscordGuild> } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : DiscordInviteApiResponse } |
  { 'Err' : string };
export type SpaceArgs = { 'UpgradeArg' : { 'version' : bigint } } |
  { 'InitArg' : SpaceInitArg };
export interface SpaceInitArg {
  'owner' : Principal,
  'ckusdc_ledger' : CkUsdcLedger,
  'space_symbol' : [] | [string],
  'space_background' : [] | [string],
  'current_wasm_version' : bigint,
  'space_logo' : [] | [string],
  'space_name' : string,
  'space_description' : string,
}
export interface State {
  'space_symbol' : [] | [string],
  'space_background' : [] | [string],
  'space_logo' : [] | [string],
  'space_name' : string,
  'tasks_count' : bigint,
  'space_description' : string,
}
export type Submission = { 'Text' : { 'content' : string } } |
  { 'Discord' : { 'guild_id' : string, 'access_token' : string } };
export interface SubmissionData {
  'state' : SubmissionState,
  'submission' : Submission,
}
export type SubmissionState = { 'Rejected' : null } |
  { 'WaitingForReview' : null } |
  { 'Accepted' : null };
export interface Task {
  [x: string]: ReactNode;
  'tasks' : Array<TaskType>,
  'creator' : Principal,
  'task_title' : string,
  'token_reward' : TokenReward,
  'created_at' : bigint,
  'rewarded' : Array<Principal>,
  'number_of_uses' : bigint,
}
export type TaskContent = {
    'Discord' : {
      'task_description' : string,
      'task_title' : string,
      'guild_id' : string,
      'discord_invite_link' : string,
      'guild_icon' : [] | [string],
      'expires_at' : [] | [string],
    }
  } |
  {
    'TitleAndDescription' : {
      'task_description' : string,
      'task_title' : string,
    }
  };
export type TaskType = {
    'DiscordTask' : {
      'guild_id' : string,
      'task_content' : TaskContent,
      'discord_invite_link' : string,
      'guild_icon' : [] | [string],
      'expires_at' : [] | [string],
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
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface WalletReceiveResult { 'accepted' : bigint }
export interface _SERVICE {
  'accept_subtask_submission' : ActorMethod<
    [Principal, bigint, bigint],
    Result
  >,
  'create_task' : ActorMethod<[CreateTaskArgs], Result_1>,
  'get_closed_tasks' : ActorMethod<[GetTasksArgs], Result_2>,
  'get_current_bytecode_version' : ActorMethod<[], bigint>,
  'get_discord_guilds' : ActorMethod<[string], Result_3>,
  'get_open_tasks' : ActorMethod<[GetTasksArgs], Result_2>,
  'get_state' : ActorMethod<[], State>,
  'reject_subtask_submission' : ActorMethod<
    [Principal, bigint, bigint],
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
  'transform_http_response' : ActorMethod<[TransformArgs], HttpResponse>,
  'validate_discord_invite_link' : ActorMethod<[string, string], Result_4>,
  'wallet_balance' : ActorMethod<[], bigint>,
  'wallet_receive' : ActorMethod<[], WalletReceiveResult>,
  'withdraw_reward' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
