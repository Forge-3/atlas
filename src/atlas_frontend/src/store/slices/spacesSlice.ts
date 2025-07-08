import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { StorableState } from "../../canisters/atlasSpace/types";
import type { AnyTask } from "../../canisters/atlasSpace/api";

type Spaces = {
  [key: string]: {
    state: null | StorableState;
    tasks: null | { [key: string]: AnyTask };
  };
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
      state.spaces = action.payload;
    },
    setSpace: (
      state,
      action: PayloadAction<{ state: StorableState; spaceId: string }>
    ) => {
      const spaceId = action.payload.spaceId;
      const spaceState = action.payload.state;

      if (!state.spaces) {
        state.spaces = {
          [spaceId]: { state: spaceState, tasks: null },
        };
      } else if (!state.spaces[spaceId]) {
        state.spaces[spaceId] = { state: spaceState, tasks: null };
      } else if (!state.spaces[spaceId].state) {
        state.spaces[spaceId].state = spaceState;
      }
    },
    setTasks: (
      state,
      action: PayloadAction<{
        tasks: { [key: string]: AnyTask };
        spaceId: string;
      }>
    ) => {
      const spaceId = action.payload.spaceId;
      const tasks = action.payload.tasks;
      if (state.spaces?.[spaceId]?.state) {
        state.spaces[spaceId].tasks = tasks;
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
