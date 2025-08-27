import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UsersCountPerSpace = {
    [key: string]: bigint;
  }

interface StatsState {
  usersCount: null | bigint;
  usersPerSpace: UsersCountPerSpace;
}

const initialState: StatsState = {
  usersCount: null,
  usersPerSpace: {},
};

export const statsSlice = createSlice({
  name: "stats",
  initialState,
  reducers: {
    setUsersCount: (state, action: PayloadAction<bigint>) => {
      state.usersCount = action.payload;
    },
    setSpaceUsersCount: (
      state,
      action: PayloadAction<{ spaceId: string; count: bigint }>
    ) => {
      const { spaceId, count } = action.payload;

      state.usersPerSpace[spaceId] = count;
    },
  },
});

export const { setUsersCount, setSpaceUsersCount } = statsSlice.actions;

export default statsSlice.reducer;
