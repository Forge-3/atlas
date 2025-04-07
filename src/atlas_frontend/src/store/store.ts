import { configureStore } from '@reduxjs/toolkit';
import appSliceReducer from './slices/appSlice.ts';
import userSliceReducer from './slices/userSlice.ts';

export const store = configureStore({
  reducer: {
    app: appSliceReducer,
    user: userSliceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;