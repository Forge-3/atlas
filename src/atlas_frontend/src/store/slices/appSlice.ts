import type { Principal } from "@dfinity/principal";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type Config } from "../../../../declarations/atlas_main/atlas_main.did.js"

export interface StorableConfig extends Omit<Config, "ckusdc_ledger"> {
  ckusdc_ledger: { fee: bigint | null; principal: Principal };
}

interface AppState {
  blockchainConfig: null | StorableConfig;
  isScreenBlur: boolean;
  isLoading: boolean;
  isInitialUserLoading: boolean;
}

const initialState: AppState = {
  blockchainConfig: null,
  isScreenBlur: false,
  isLoading: false,
  isInitialUserLoading: false,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setScreenBlur: (state, action: PayloadAction<boolean>) => {
      state.isScreenBlur = action.payload;
    },
    setConfig: (state, action: PayloadAction<StorableConfig>) => {
      state.blockchainConfig = action.payload;
    },
    setInitialUserLoading: (state, action: PayloadAction<boolean>) => {
      state.isInitialUserLoading = action.payload;
    },
  },
  selectors: {
    selectBlockchainConfig: (state: AppState) => {
      if (state.blockchainConfig) return state.blockchainConfig
      return null
    }
  }
});

export const { setScreenBlur, setConfig, setLoading, setInitialUserLoading } =
  appSlice.actions;
  export const { selectBlockchainConfig } = appSlice.selectors;
  
export default appSlice.reducer;
