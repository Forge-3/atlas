import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  discordUserId: string | null;
}

const initialState: UserState = {
    discordUserId: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setDiscordUserId : (state, action: PayloadAction<string | null>) => {
      state.discordUserId = action.payload;
    },
  },
});

export const { setDiscordUserId } = userSlice.actions;
export default userSlice.reducer;