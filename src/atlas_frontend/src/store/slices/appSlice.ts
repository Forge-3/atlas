import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface StorableConfig {
  spaces_per_space_lead: number;
  ckusdc_ledger: { fee: bigint | null; principal: string };
}

interface AppState {
  blockchainConfig: null | StorableConfig;
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
    setConfig: (state, action: PayloadAction<StorableConfig>) => {
      state.blockchainConfig = action.payload;
    },
  },
  selectors: {
    selectBlockchainConfig: (state: AppState) => state.blockchainConfig
  }
});

export const { setScreenBlur, setConfig } =
  appSlice.actions;
  export const { selectBlockchainConfig } = appSlice.selectors;
  
export default appSlice.reducer;
