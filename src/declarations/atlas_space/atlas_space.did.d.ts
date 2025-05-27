import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CkUsdcLedger { 'fee' : [] | [bigint], 'principal' : Principal }
export interface CreateTaskArgs {
  'task_title' : string,
  'token_reward' : TokenReward,
  'task_content' : Array<TaskContent>,
  'number_of_uses' : bigint,
}
export type Error = { 'BytecodeUpToDate' : null } |
  { 'NotAdminNorOwner' : null } |
  { 'FailedToUpdateConfig' : string } |
  { 'TaskAlreadyExists' : bigint } |
  { 'FailedToCallMain' : string } |
  { 'ConfigNotSet' : null } |
  { 'UserAlreadySubmitted' : null } |
  { 'NotAdmin' : null } |
  { 'IncorrectSubmission' : string } |
  { 'CountToHigh' : { 'max' : bigint, 'found' : bigint } } |
  { 'SubtaskDoNotExists' : bigint } |
  { 'NotOwner' : null } |
  { 'FailedToTransfer' : string } |
  { 'InvalidTaskContent' : string } |
  { 'TaskDoNotExists' : bigint } |
  { 'AnonymousCaller' : null };
export interface GetTasksArgs { 'count' : bigint, 'start' : bigint }
export interface GetTasksRes {
  'tasks' : Array<[bigint, Task]>,
  'tasks_count' : bigint,
}
export type Result = { 'Ok' : bigint } |
  { 'Err' : Error };
export type Result_1 = { 'Ok' : GetTasksRes } |
  { 'Err' : Error };
export type Result_2 = { 'Ok' : null } |
  { 'Err' : Error };
export type SpaceArgs = { 'UpgradeArg' : { 'version' : bigint } } |
  { 'InitArg' : SpaceInitArg };
export interface SpaceInitArg {
  'admin' : Principal,
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
export type Submission = { 'Text' : { 'content' : string } };
export interface SubmissionData {
  'state' : SubmissionState,
  'submission' : Submission,
}
export type SubmissionState = { 'Rejected' : null } |
  { 'WaitingForReview' : null } |
  { 'Accepted' : null };
export interface Task {
  'tasks' : Array<TaskType>,
  'creator' : Principal,
  'task_title' : string,
  'token_reward' : TokenReward,
  'number_of_uses' : bigint,
}
export type TaskContent = {
    'TitleAndDescription' : {
      'task_description' : string,
      'task_title' : string,
    }
  };
export type TaskType = {
    'GenericTask' : {
      'task_content' : TaskContent,
      'submission' : Array<[Principal, SubmissionData]>,
    }
  };
export type TokenReward = { 'CkUsdc' : { 'amount' : bigint } };
export interface WalletReceiveResult { 'accepted' : bigint }
export interface _SERVICE {
  'create_task' : ActorMethod<[CreateTaskArgs], Result>,
  'get_closed_tasks' : ActorMethod<[GetTasksArgs], Result_1>,
  'get_current_bytecode_version' : ActorMethod<[], bigint>,
  'get_open_tasks' : ActorMethod<[GetTasksArgs], Result_1>,
  'get_state' : ActorMethod<[], State>,
  'set_space_background' : ActorMethod<[string], Result_2>,
  'set_space_description' : ActorMethod<[string], Result_2>,
  'set_space_logo' : ActorMethod<[string], Result_2>,
  'set_space_name' : ActorMethod<[string], Result_2>,
  'submit_subtask_submission' : ActorMethod<
    [bigint, bigint, Submission],
    Result_2
  >,
  'wallet_balance' : ActorMethod<[], bigint>,
  'wallet_receive' : ActorMethod<[], WalletReceiveResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
