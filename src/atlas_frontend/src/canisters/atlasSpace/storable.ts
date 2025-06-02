import type {
  State,
  Task,
  TokenReward,
} from "../../../../declarations/atlas_space/atlas_space.did";

export interface StorableState {
  space_symbol: string | null;
  space_background: string | null;
  space_logo: string | null;
  space_name: string;
  space_description: string;
}

export const storableState = (state: State): StorableState => {
  return {
    ...state,
    space_symbol: state.space_symbol.pop() ?? null,
    space_background: state.space_background.pop() ?? null,
    space_logo: state.space_logo.pop() ?? null,
  };
};