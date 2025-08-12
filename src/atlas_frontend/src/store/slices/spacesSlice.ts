import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { StorableState } from "../../canisters/atlasSpace/types";
import type { AnyTask } from "../../canisters/atlasSpace/api";

export type Space = {
  state: null | StorableState;
  tasks: null | { [key: string]: AnyTask };
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
        tasks: { [key: string]: AnyTask };
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
    deleteSpace: (
      state,
      action: PayloadAction<{ spaceId: string }>
    ) => {
      if (state.spaces && state.spaces[action.payload.spaceId]) {
        delete state.spaces[action.payload.spaceId];
      }
    },
    deleteTask: (
      state,
      action: PayloadAction<{
        taskId: string;
        spaceId: string;
      }>
    ) => {
      const { spaceId, taskId } = action.payload;
      delete state.spaces?.[spaceId].tasks?.[taskId];
    },
  },
  selectors: {
    getSpace: (state: SpacesState, action: PayloadAction<string>) =>
      state.spaces?.[action.payload] ?? null,
  },
});

export const { setSpaces, setSpace, setTasks, deleteTask, deleteSpace } = spaceSlice.actions;
export const { getSpace } = spaceSlice.selectors;

export default spaceSlice.reducer;
