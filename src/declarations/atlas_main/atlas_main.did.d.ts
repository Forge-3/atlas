import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AtlasArgs = {
    'UpgradeArg' : {
      'upgrade_space_arg' : [] | [SpaceArgs],
      'config' : [] | [UpdateConfig],
    }
  } |
  { 'InitArg' : Config };
export interface CkUsdcLedger { 'fee' : [] | [bigint], 'principal' : Principal }
export interface CkUsdcLedger_1 {
  'fee' : [] | [bigint],
  'principal' : Principal,
}
export interface Config {
  'spaces_per_space_lead' : number,
  'ckusdc_ledger' : CkUsdcLedger_1,
  'current_space_version' : bigint,
}
export type Error = { 'UserRankNoMatch' : Array<Rank> } |
  { 'FailedToCallSpace' : { 'err' : string, 'principal' : Principal } } |
  { 'FailedToSaveSpace' : string } |
  { 'FailedToUpdateConfig' : string } |
  { 'UserRichSpaceLimit' : { 'found' : bigint, 'expected' : bigint } } |
  { 'UserRankToHigh' : { 'found' : Rank, 'expected' : Rank } } |
  { 'UserAlreadyHaveExpectedRank' : Rank } |
  { 'UserNotAnOwner' : Principal } |
  { 'CountToHigh' : { 'max' : bigint, 'found' : bigint } } |
  { 'SpaceNotExist' : null } |
  { 'FailedToGetCanisterInfo' : string } |
  { 'FailedToInstallWASM' : string } |
  { 'UserRankToLow' : { 'found' : Rank, 'expected' : Rank } } |
  { 'FailedToInitializeCanister' : string } |
  { 'CreationInProgress' : null } |
  { 'UserDoNotExist' : null } |
  { 'FailedToUpdateCanisterSettings' : string } |
  { 'UserAlreadyIsHubMember' : null } |
  { 'AnonymousCaller' : null };
export interface GetSpacesArgs { 'count' : bigint, 'start' : bigint }
export interface GetSpacesRes {
  'spaces' : Array<Space>,
  'spaces_count' : bigint,
}
export type GetUserBy = { 'Principal' : Principal };
export interface Integrations { 'discord_id' : [] | [string] }
export type Rank = { 'SpaceLead' : null } |
  { 'User' : null } |
  { 'SuperAdmin' : null } |
  { 'Admin' : null };
export type Result = { 'Ok' : Space } |
  { 'Err' : Error };
export type Result_1 = { 'Ok' : GetSpacesRes } |
  { 'Err' : Error };
export type Result_2 = { 'Ok' : null } |
  { 'Err' : Error };
export interface Space { 'id' : Principal, 'space_type' : SpaceType }
export type SpaceArgs = { 'UpgradeArg' : { 'version' : bigint } } |
  { 'InitArg' : SpaceInitArg };
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
export type SpaceType = { 'HUB' : null };
export interface UpdateConfig {
  'spaces_per_space_lead' : [] | [number],
  'ckusdc_ledger' : [] | [CkUsdcLedger_1],
}
export interface User {
  'integrations' : Integrations,
  'rank' : Rank,
  'space_creation_in_progress' : boolean,
  'belonging_to_spaces' : BigUint64Array | bigint[],
  'owned_spaces' : BigUint64Array | bigint[],
}
export interface WalletReceiveResult { 'accepted' : bigint }
export interface _SERVICE {
  'app_config' : ActorMethod<[], Config>,
  'create_new_space' : ActorMethod<
    [
      string,
      string,
      [] | [string],
      [] | [string],
      [] | [string],
      SpaceType,
      Array<[string, string]>,
    ],
    Result
  >,
  'get_current_space_bytecode_version' : ActorMethod<[], bigint>,
  'get_space_bytecode_by_version' : ActorMethod<
    [bigint],
    [] | [Uint8Array | number[]]
  >,
  'get_spaces' : ActorMethod<[GetSpacesArgs], Result_1>,
  'get_user' : ActorMethod<[GetUserBy], User>,
  'get_user_hub' : ActorMethod<[Principal], [] | [Space]>,
  'join_space' : ActorMethod<[Principal], Result_2>,
  'set_user_admin' : ActorMethod<[Principal], Result_2>,
  'set_user_space_lead' : ActorMethod<[Principal], Result_2>,
  'upgrade_space' : ActorMethod<[Principal], Result_2>,
  'user_is_admin' : ActorMethod<[Principal], boolean>,
  'user_is_in_hub' : ActorMethod<[Principal], boolean>,
  'user_is_in_space' : ActorMethod<[Principal, Principal], boolean>,
  'wallet_balance' : ActorMethod<[], bigint>,
  'wallet_receive' : ActorMethod<[], WalletReceiveResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
