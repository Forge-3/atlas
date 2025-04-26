import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Error = { 'NotAdminNorOwner' : null } |
  { 'FailedToUpdateConfig' : string } |
  { 'ConfigNotSet' : null } |
  { 'NotAdmin' : null } |
  { 'NotOwner' : null } |
  { 'AnonymousCaller' : null };
export type Result = { 'Ok' : null } |
  { 'Err' : Error };
export type SpaceArgs = { 'UpgradeArg' : null } |
  { 'InitArg' : SpaceInitArg };
export interface SpaceInitArg {
  'admin' : Principal,
  'space_symbol' : [] | [string],
  'space_background' : [] | [string],
  'space_logo' : [] | [string],
  'space_name' : string,
  'space_description' : string,
}
export interface State {
  'space_symbol' : [] | [string],
  'space_background' : [] | [string],
  'space_logo' : [] | [string],
  'space_name' : string,
  'space_description' : string,
}
export interface WalletReceiveResult { 'accepted' : bigint }
export interface _SERVICE {
  'get_state' : ActorMethod<[], State>,
  'set_space_background' : ActorMethod<[string], Result>,
  'set_space_description' : ActorMethod<[string], Result>,
  'set_space_logo' : ActorMethod<[string], Result>,
  'set_space_name' : ActorMethod<[string], Result>,
  'wallet_balance' : ActorMethod<[], bigint>,
  'wallet_receive' : ActorMethod<[], WalletReceiveResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
