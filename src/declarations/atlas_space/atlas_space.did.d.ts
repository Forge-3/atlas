import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CkUsdcLedger { 'fee' : [] | [bigint], 'principal' : Principal }
export interface CreateSubtaskArg {
  'title' : string,
  'description' : string,
  'task_type' : string,
  'allow_resubmit' : boolean,
}
export interface CreateTaskArgs {
  'task_title' : string,
  'token_reward' : TokenReward,
  'task_content' : Array<CreateSubtaskArg>,
  'number_of_uses' : bigint,
}
export interface EditSpaceArgs {
  'external_links' : Array<[string, string]>,
  'space_background' : [] | [string],
  'space_logo' : [] | [string],
  'space_name' : string,
  'space_description' : string,
}
export type Error = { 'BytecodeUpToDate' : null } |
  { 'NotParent' : null } |
  { 'UsageLimitExceeded' : null } |
  { 'UserSubmissionNotFound' : null } |
  { 'FailedToUpdateConfig' : string } |
  { 'UserDoesNotBelongToSpace' : null } |
  { 'TaskAlreadyExists' : bigint } |
  { 'FailedToCallMain' : string } |
  { 'ConfigNotSet' : null } |
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
  { 'TaskDoNotExists' : bigint } |
  { 'AnonymousCaller' : null } |
  { 'SubmissionNotAccepted' : null };
export interface GetTasksArgs { 'count' : bigint, 'start' : bigint }
export interface GetTasksRes {
  'tasks' : Array<[bigint, Task]>,
  'tasks_count' : bigint,
}
export type Result = { 'Ok' : null } |
  { 'Err' : Error };
export type Result_1 = { 'Ok' : bigint } |
  { 'Err' : Error };
export type Result_2 = { 'Ok' : GetTasksRes } |
  { 'Err' : Error };
export type SpaceArgs = { 'UpgradeArg' : { 'version' : bigint } } |
  { 'InitArg' : SpaceInitArg };
export interface SpaceInitArg {
  'external_links' : Array<[string, string]>,
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
  'external_links' : Array<[string, string]>,
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
  'rewarded' : Array<Principal>,
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
      'allow_resubmit' : boolean,
    }
  };
export type TokenReward = { 'CkUsdc' : { 'amount' : bigint } };
export interface WalletReceiveResult { 'accepted' : bigint }
export interface _SERVICE {
  'accept_subtask_submission' : ActorMethod<
    [Principal, bigint, bigint],
    Result
  >,
  'create_task' : ActorMethod<[CreateTaskArgs], Result_1>,
  'edit_space' : ActorMethod<[EditSpaceArgs], Result>,
  'get_closed_tasks' : ActorMethod<[GetTasksArgs], Result_2>,
  'get_current_bytecode_version' : ActorMethod<[], bigint>,
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
  'wallet_balance' : ActorMethod<[], bigint>,
  'wallet_receive' : ActorMethod<[], WalletReceiveResult>,
  'withdraw_reward' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
