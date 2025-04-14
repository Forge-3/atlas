import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserData } from "../../integrations/discord.ts";

interface UserState {
  integrations: {
    discord: {
      accessToken: string | null;
      userData: UserData | null;
    };
  };
}

const initialState = (): UserState => {
const accessToken = localStorage.getItem("discordUserAccessToken")
const userData = localStorage.getItem("discordUserData")

return {
  integrations: {
    discord: {
      accessToken,
      userData: userData !== null ? JSON.parse(userData) : null,
    },
  },
}
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDiscordData: (state, action: PayloadAction<UserData>) => {
      localStorage.setItem("discordUserData", JSON.stringify(action.payload))
      state.integrations.discord.userData = action.payload;
    },
    setUserDiscordAccessToken: (state, action: PayloadAction<string>) => {
      localStorage.setItem("discordUserAccessToken", action.payload)
      state.integrations.discord.accessToken = action.payload;
    },
  },
  selectors: {
    selectUserDiscordData: (userState: UserState) => {
      const localUserData = localStorage.getItem("discordUserData");
      const parsedLocalUserData = localUserData !== null ? JSON.parse(localUserData) : null

      const accessToken = userState.integrations.discord.accessToken || localStorage.getItem("discordUserAccessToken")
      const userData = userState.integrations.discord.userData || parsedLocalUserData

      return {
        accessToken,
        userData
      }
    }
  }
});

export const { setUserDiscordData, setUserDiscordAccessToken } = userSlice.actions;
export const { selectUserDiscordData } = userSlice.selectors
export default userSlice.reducer;
