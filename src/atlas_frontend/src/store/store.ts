import {
  createReduxMiddleware,
  defaultOptions,
  deserify,
} from "@karmaniverous/serify-deserify";
import { configureStore } from "@reduxjs/toolkit";
import appSliceReducer from "./slices/appSlice";
import userSliceReducer from "./slices/userSlice";
import spacesSliceReducer from "./slices/spacesSlice";
import statsSliceReducer from "./slices/statsSlice";
import { Principal } from "@dfinity/principal";

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
    Uint8Array: {
      serifier: (value: Uint8Array) => Array.from(value),
      deserifier: (value: Array<number>) => Uint8Array.from(value),
    },
  },
};

const serifyMiddleware = createReduxMiddleware(customSerify);

export const store = configureStore({
  reducer: {
    app: appSliceReducer,
    user: userSliceReducer,
    spaces: spacesSliceReducer,
    stats: statsSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(serifyMiddleware),
});


export const deserialize = <T>(type: unknown): T | null => {
  if (type) return deserify(type, customSerify) as T
  return null
}
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
