import {
  createReduxMiddleware,
  defaultOptions,
} from "@karmaniverous/serify-deserify";
import { configureStore } from "@reduxjs/toolkit";
import appSliceReducer from "./slices/appSlice";
import userSliceReducer from "./slices/userSlice";
import spacesSliceReducer from "./slices/spacesSlice";
import { Principal } from "@dfinity/principal";

const serifyMiddleware = createReduxMiddleware(defaultOptions);

export const store = configureStore({
  reducer: {
    app: appSliceReducer,
    user: userSliceReducer,
    spaces: spacesSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(serifyMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const serifyPrincipal = {
  serifier: (value: Principal) => value.toString(),
  deserifier: (value: string) => Principal.from(value),
};

export const customSerify = {
  ...defaultOptions,
  types: {
    ...defaultOptions.types,
    _Principal: serifyPrincipal,
    __principal__: serifyPrincipal,
    Principal: serifyPrincipal,
  },
};
