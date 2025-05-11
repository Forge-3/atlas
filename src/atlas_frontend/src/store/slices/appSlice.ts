import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Config,
  Space,
} from "../../../../declarations/atlas_main/atlas_main.did.d.ts";

export interface SimpleState {
  space_symbol: string | null;
  space_background: string | null;
  space_logo: string | null;
  space_name: string;
  space_description: string;
}

type Spaces = { [key: string]: null | SimpleState };

interface AppState {
  blockchainConfig: null | Config;
  isScreenBlur: boolean;
  spaces: Spaces | null;
}

const initialState: AppState = {
  blockchainConfig: null,
  isScreenBlur: false,
  spaces: null,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setScreenBlur: (state, action: PayloadAction<boolean>) => {
      state.isScreenBlur = action.payload;
    },
    setConfig: (state, action: PayloadAction<Config>) => {
      state.blockchainConfig = action.payload;
    },
    setSpaces: (state, action: PayloadAction<Spaces>) => {
      state.spaces = action.payload;
    },
    setSpace: (
      state,
      action: PayloadAction<{ state: SimpleState; spaceId: string }>
    ) => {
      const spaceId = action.payload.spaceId
      const spaceState = action.payload.state
      
      if (state.spaces) {
        state.spaces[spaceId] = action.payload.state;
      } else if (!state.spaces) {
        state.spaces = {
          [spaceId]: spaceState,
        };
      }
    },
  },
});

export const { setScreenBlur, setConfig, setSpaces, setSpace } = appSlice.actions;
export default appSlice.reducer;
