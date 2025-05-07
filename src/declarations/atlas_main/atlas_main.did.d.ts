import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AtlasArgs = { 'UpgradeArg' : [] | [Config] } |
  { 'InitArg' : Config };
export interface Config { 'spaces_per_space_lead' : number }
export type Error = { 'UserRankNoMatch' : Rank } |
  { 'FailedToSaveSpace' : string } |
  { 'FailedToUpdateConfig' : string } |
  { 'UserRichSpaceLimit' : { 'found' : bigint, 'expected' : bigint } } |
  { 'UserRankToHigh' : { 'found' : Rank, 'expected' : Rank } } |
  { 'UserAlreadyHaveExpectedRank' : Rank } |
  { 'CountToHigh' : { 'max' : bigint, 'found' : bigint } } |
  { 'FailedToGetCanisterInfo' : string } |
  { 'FailedToInstallWASM' : string } |
  { 'FailedToInitializeCanister' : string } |
  { 'UserDoNotExist' : null } |
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
  { 'Admin' : null };
export type Result = { 'Ok' : Space } |
  { 'Err' : Error };
export type Result_1 = { 'Ok' : GetSpacesRes } |
  { 'Err' : Error };
export type Result_2 = { 'Ok' : null } |
  { 'Err' : Error };
export interface Space { 'id' : Principal }
export interface User {
  'integrations' : Integrations,
  'rank' : Rank,
  'owned_spaces' : BigUint64Array | bigint[],
}
export interface WalletReceiveResult { 'accepted' : bigint }
export interface _SERVICE {
  'app_config' : ActorMethod<[], Config>,
  'create_new_space' : ActorMethod<
    [string, string, [] | [string], [] | [string], [] | [string]],
    Result
  >,
  'get_spaces' : ActorMethod<[GetSpacesArgs], Result_1>,
  'get_user' : ActorMethod<[GetUserBy], User>,
  'set_user_space_lead' : ActorMethod<[Principal], Result_2>,
  'wallet_balance' : ActorMethod<[], bigint>,
  'wallet_receive' : ActorMethod<[], WalletReceiveResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
