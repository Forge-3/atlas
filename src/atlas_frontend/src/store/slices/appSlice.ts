import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isScreenBlur: boolean;
}

const initialState: AppState = {
    isScreenBlur: false,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setScreenBlur: (state, action: PayloadAction<boolean>) => {
      state.isScreenBlur = action.payload;
    },
  },
});

export const { setScreenBlur } = appSlice.actions;
export default appSlice.reducer;