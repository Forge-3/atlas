import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Config } from "../../../../declarations/atlas_main/atlas_main.did.d.ts";

interface AppState {
  blockchainConfig: null | Config;
  isScreenBlur: boolean;
}

const initialState: AppState = {
  blockchainConfig: null,
  isScreenBlur: false,
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
  },
});

export const { setScreenBlur, setConfig } = appSlice.actions;
export default appSlice.reducer;
