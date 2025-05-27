import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserData } from "../../integrations/discord.ts";
import type {
  Integrations,
  Rank,
  User,
} from "../../../../declarations/atlas_main/atlas_main.did.js";


interface StorableUser extends User {
  "owned_spaces": Array<bigint>;
}
export class BlockchainUser implements StorableUser {
  "integrations": Integrations;
  "rank": Rank;
  "owned_spaces": Array<bigint>;
  'space_creation_in_progress': boolean;
  
  constructor(user: StorableUser) {
    this.integrations = user.integrations;
    this.rank = user.rank;
    this.owned_spaces = user.owned_spaces;
  }

  getRank() {
    return Object.keys(this.rank)[0] as keyof Rank;
  }

  isSpaceLead() {
    return Object.keys(this.rank)[0] as keyof Rank === "SpaceLead"; 
  }

  isAdmin() {
    return Object.keys(this.rank)[0] as keyof Rank === "Admin"; 
  }
}

interface UserState {
  blockchain: StorableUser | null;
  integrations: {
    discord: {
      accessToken: string | null;
      userData: UserData | null;
    };
  };
}

const initialState = (): UserState => {
  const accessToken = localStorage.getItem("discordUserAccessToken");
  const userData = localStorage.getItem("discordUserData");

  return {
    blockchain: null,
    integrations: {
      discord: {
        accessToken,
        userData: userData !== null ? JSON.parse(userData) : null,
      },
    },
  };
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserDiscordData: (state, action: PayloadAction<UserData>) => {
      localStorage.setItem("discordUserData", JSON.stringify(action.payload));
      state.integrations.discord.userData = action.payload;
    },
    setUserDiscordAccessToken: (state, action: PayloadAction<string>) => {
      localStorage.setItem("discordUserAccessToken", action.payload);
      state.integrations.discord.accessToken = action.payload;
    },
    setUserBlockchainData: (state, action: PayloadAction<StorableUser>) => {
      state.blockchain = action.payload
    },
  },
  selectors: {
    selectUserDiscordData: (userState: UserState) => {
      const localUserData = localStorage.getItem("discordUserData");
      const parsedLocalUserData =
        localUserData !== null ? JSON.parse(localUserData) : null;

      const accessToken =
        userState.integrations.discord.accessToken ||
        localStorage.getItem("discordUserAccessToken");
      const userData =
        userState.integrations.discord.userData || parsedLocalUserData;

      return {
        accessToken,
        userData,
      };
    },
    selectUserBlockchainData: (userState: UserState) => {
      if (!userState.blockchain) return null;
      return new BlockchainUser(userState.blockchain);
    },
  },
});

export const {
  setUserDiscordData,
  setUserDiscordAccessToken,
  setUserBlockchainData,
} = userSlice.actions;
export const { selectUserDiscordData, selectUserBlockchainData } = userSlice.selectors;
export default userSlice.reducer;
