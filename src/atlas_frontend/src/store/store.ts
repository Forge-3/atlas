import {
  createReduxMiddleware,
  defaultOptions,
} from '@karmaniverous/serify-deserify';
import { configureStore } from '@reduxjs/toolkit';
import appSliceReducer from './slices/appSlice';
import userSliceReducer from './slices/userSlice';

const serifyMiddleware = createReduxMiddleware(defaultOptions);

export const store = configureStore({
  reducer: {
    app: appSliceReducer,
    user: userSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(serifyMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;