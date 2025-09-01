import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { serify } from "@karmaniverous/serify-deserify";
import { type AppDispatch, type RootState, customSerify } from "../../store/store";
import { getAllSpaces } from "../../canisters/atlasMain/api";
import { getAtlasSpace, type AnyTask } from "../../canisters/atlasSpace/api";
import {
  getUnAuthAtlasSpaceActor,
  useUnAuthAgent,
  useUnAuthAtlasMainActor,
} from "../../hooks/identityKit";
import { Principal } from "@dfinity/principal";
import type { StorableState } from "../../canisters/atlasSpace/types";

export type Space = {
  state: StorableState | null;
  tasks: Record<string, AnyTask> | null;
};

export type Spaces = Record<string, Space>;

export type LsStatus = { hasEntry: boolean; hasData: boolean };

interface SpacesState {
  spaces: Spaces;
  loading: boolean;
  error: string | null;
}

const initialState: SpacesState = {
  spaces: {},
  loading: false,
  error: null,
};

export const fetchSpacesFromApi = createAsyncThunk<
  Spaces,
  void,
  { dispatch: AppDispatch; state: RootState }
>("spaces/fetchFromApi", async (_, { dispatch }) => {
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const agent = useUnAuthAgent();

  if (!(unAuthAtlasMain && agent)) {
    throw new Error("Atlas main or agent not available");
  }

  const spacesIDs = await getAllSpaces({ dispatch, unAuthAtlasMain });
  const spaceIds = Object.keys(spacesIDs);

  const results = await Promise.all(
    spaceIds.map(async (spaceId) => {
      const spacePrincipal = Principal.from(spaceId);
      const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, spacePrincipal);
      if (!unAuthAtlasSpace) return null;

      return await getAtlasSpace({
        spaceId,
        unAuthAtlasSpace,
        dispatch,
      });
    })
  );

  const validResults = results.filter(Boolean) as Array<{ 
    spaceId: string; 
    state: StorableState 
  }>;

  const newSpaces: Spaces = {};
  for (const s of validResults) {
    newSpaces[s.spaceId] = { 
      state: s.state, 
      tasks: null 
    };
  }

  return newSpaces;
});

export const saveSpacesToLocalStorage =
  () => (_dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const { spaces } = getState().spaces;
      const serialized = JSON.stringify(serify(spaces ?? {}, customSerify));
      localStorage.setItem("atlasSpaces", serialized);
    } catch (err) {
      console.error("Failed to save spaces to localStorage:", err);
    }
  };

export const loadSpacesFromLocalStorage =
  () =>
  (dispatch: AppDispatch, getState: () => RootState): LsStatus => {
    try {
      const raw = localStorage.getItem("atlasSpaces");
      if (raw === null) return { hasEntry: false, hasData: false };

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        localStorage.removeItem("atlasSpaces");
        return { hasEntry: true, hasData: false };
      }

      if (!parsed || typeof parsed !== "object") {
        return { hasEntry: true, hasData: false };
      }

      const next = parsed as Spaces;
      const hasData = Object.keys(next).length > 0;

      const current = getState().spaces.spaces ?? {};
      if (JSON.stringify(current) !== JSON.stringify(next)) {
        dispatch(setSpaces(next));
      }

      return { hasEntry: true, hasData };
    } catch {
      return { hasEntry: false, hasData: false };
    }
  };

export const spaceSlice = createSlice({
  name: "space",
  initialState,
  reducers: {
    setSpaces: (state, action: PayloadAction<Spaces>) => {
      const next = {
        ...state.spaces,
        ...action.payload,
      };
      if (JSON.stringify(state.spaces) === JSON.stringify(next)) return;
      state.spaces = next;

    },
    setSpace: (
      state,
      action: PayloadAction<{ state: StorableState; spaceId: string }>
    ) => {
      const { spaceId, state: spaceState } = action.payload;

      if (!state.spaces) {
        state.spaces = {};
      }

      const prev = state.spaces[spaceId];

      if (prev && JSON.stringify(prev.state) === JSON.stringify(spaceState)) {
      return;
      }

      if (!prev) {
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
