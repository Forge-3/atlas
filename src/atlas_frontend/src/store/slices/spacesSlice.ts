import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Task } from "../../../../declarations/atlas_space/atlas_space.did";
import type { StorableState } from "../../canisters/atlasSpace/types";

export type Space = {
  state: null | StorableState;
  tasks: null | { [key: string]: Task };
};
export type Spaces = {
  [key: string]: Space;
};

interface SpacesState {
  spaces: Spaces | null;
}

const initialState: SpacesState = {
  spaces: null,
};

export const spaceSlice = createSlice({
  name: "space",
  initialState,
  reducers: {
    setSpaces: (state, action: PayloadAction<Spaces>) => {
      state.spaces = {
        ...state.spaces,
        ...action.payload,
      };
    },
    setSpace: (
      state,
      action: PayloadAction<{ state: StorableState; spaceId: string }>
    ) => {
      const { spaceId, state: spaceState } = action.payload;

      if (!state.spaces) {
        state.spaces = {};
      }

      if (!state.spaces[spaceId]) {
        state.spaces[spaceId] = { state: spaceState, tasks: null };
      } else {
        state.spaces[spaceId].state = spaceState;
      }
    },
    setTasks: (
      state,
      action: PayloadAction<{
        tasks: { [key: string]: Task };
        spaceId: string;
      }>
    ) => {
      const { spaceId, tasks } = action.payload;
      if (state.spaces?.[spaceId]?.state) {
        state.spaces[spaceId].tasks = {
          ...state.spaces[spaceId].tasks,
          ...tasks,
        };
      }
    },
  },
  selectors: {
    getSpace: (state: SpacesState, action: PayloadAction<string>) =>
      state.spaces?.[action.payload] ?? null,
  },
});

export const { setSpaces, setSpace, setTasks } = spaceSlice.actions;
export const { getSpace } = spaceSlice.selectors;

export default spaceSlice.reducer;
