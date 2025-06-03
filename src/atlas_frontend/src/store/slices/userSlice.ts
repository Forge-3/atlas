import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserData } from "../../integrations/discord.ts";
import type {
  Integrations,
  Rank,
  User,
} from "../../../../declarations/atlas_main/atlas_main.did.js";


export interface DiscordIntegrationState {
  accessToken: string | null;
  userData: UserData | null;
  tokenType: string | null;
  state: string | null;
  expiresIn: number | null;
  guildId: string | null;
}

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
    discord: DiscordIntegrationState;
    };
}

const initialState = (): UserState => {
  const storedAccessToken = localStorage.getItem("discordUserAccessToken");
  const storedUserData = localStorage.getItem("discordUserData");
  const parsedUserData = storedUserData !== null ? JSON.parse(storedUserData) : null;

  return {
    blockchain: null,
    integrations: {
      discord: {
        accessToken: storedAccessToken,
        userData: parsedUserData,
        tokenType: null,
        state: null,
        expiresIn: null,
        guildId: null,
      },
    },
  };
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setDiscordIntegrationData: (state, action: PayloadAction<{
      tokenType: string;
      accessToken: string;
      state: string;
      expiresIn: number;
      guildId: string;
      userData?: UserData;
    }>) => {
      localStorage.setItem("discordUserAccessToken", action.payload.accessToken);
      if (action.payload.userData) {
        localStorage.setItem("discordUserData", JSON.stringify(action.payload.userData));
      }

      state.integrations.discord.accessToken = action.payload.accessToken;
      state.integrations.discord.tokenType = action.payload.tokenType;
      state.integrations.discord.state = action.payload.state;
      state.integrations.discord.expiresIn = action.payload.expiresIn;
      state.integrations.discord.guildId = action.payload.guildId;
      if (action.payload.userData) {
        state.integrations.discord.userData = action.payload.userData;
      }
    },
    clearDiscordIntegrationData: (state) => {
      state.integrations.discord.accessToken = null;
      state.integrations.discord.userData = null;
      state.integrations.discord.tokenType = null;
      state.integrations.discord.state = null;
      state.integrations.discord.expiresIn = null;
      state.integrations.discord.guildId = null;
    },
    setUserBlockchainData: (state, action: PayloadAction<StorableUser>) => {
      state.blockchain = action.payload
    },
  },
  selectors: {
    selectUserDiscordData: (userState: UserState) => {
      return userState.integrations.discord;
    },
    selectUserBlockchainData: (userState: UserState) => {
      if (!userState.blockchain) return null;
      return new BlockchainUser(userState.blockchain);
    },
  },
});

export const {
  setDiscordIntegrationData,
  setUserBlockchainData,
  clearDiscordIntegrationData,
} = userSlice.actions;
export const { selectUserDiscordData, selectUserBlockchainData } = userSlice.selectors;
export default userSlice.reducer;
