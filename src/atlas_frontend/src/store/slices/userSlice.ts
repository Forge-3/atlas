import { deserify, serify } from "@karmaniverous/serify-deserify";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserData } from "../../integrations/discord.ts";
import type {
  Integrations,
  Rank,
  Space,
  User,
} from "../../../../declarations/atlas_main/atlas_main.did.js";
import type { Principal } from "@dfinity/principal";
import { customSerify } from "../store.ts";

export interface DiscordIntegrationState {
  accessToken: string | null;
  userData: UserData | null;
  tokenType: string | null;
  state: string | null;
  expiresIn: number | null;
  guildId: string | null;
  guilds?: DiscordGuild[] | null;
  loadingGuilds?: boolean;
  error: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface StorableUser extends User {
  owned_spaces: Array<bigint>;
}
export class BlockchainUser implements StorableUser {
  "integrations": Integrations;
  "rank": Rank;
  "owned_spaces": Array<bigint>;
  "space_creation_in_progress": boolean;
  "belonging_to_spaces": Array<bigint>;

  constructor(user: StorableUser) {
    this.integrations = user.integrations;
    this.rank = user.rank;
    this.owned_spaces = user.owned_spaces;
  }

  getRank() {
    return Object.keys(this.rank)[0] as keyof Rank;
  }

  isSpaceLead() {
    return this.getRank() === "SpaceLead";
  }

  isAdmin() {
    return this.getRank() === "Admin";
  }

  isSuperAdmin() {
    return this.getRank() === "SuperAdmin";
  }
}

interface UserState {
  blockchain: StorableUser | null;
  integrations: {
    discord: DiscordIntegrationState;
    };
  userHub: Principal | null;
}

const initialState = (): UserState => {
  const storedAccessToken = localStorage.getItem("discordUserAccessToken");
  const storedUserData = localStorage.getItem("discordUserData");
  const parsedUserData = storedUserData !== null ? JSON.parse(storedUserData) : null;

  return {
    userHub: null,
    blockchain: null,
    integrations: {
      discord: {
        accessToken: storedAccessToken,
        userData: parsedUserData,
        tokenType: null,
        state: null,
        expiresIn: null,
        guildId: null,
        guilds: null,
        loadingGuilds: false,
        error: null
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
      if (action.payload.userData) {
        state.integrations.discord.userData = action.payload.userData;
      }
      state.integrations.discord.guilds = null;
      state.integrations.discord.loadingGuilds = false;
      state.integrations.discord.error = null;
    },
    setDiscordGuilds: (state, action: PayloadAction<{ guilds: DiscordGuild[] | null; loading: boolean; error: string | null }>) => {
      state.integrations.discord.guilds = action.payload.guilds;
      state.integrations.discord.loadingGuilds = action.payload.loading;
      state.integrations.discord.error = action.payload.error;
    },
    clearDiscordIntegrationData: (state) => {
      state.integrations.discord.accessToken = null;
      state.integrations.discord.userData = null;
      state.integrations.discord.tokenType = null;
      state.integrations.discord.state = null;
      state.integrations.discord.expiresIn = null;
      state.integrations.discord.guildId = null;
      state.integrations.discord.guilds = null;
      state.integrations.discord.loadingGuilds = false;
      state.integrations.discord.error = null;
      localStorage.removeItem("discordUserAccessToken");
      localStorage.removeItem("discordUserData");
    },
    setUserBlockchainData: (state, action: PayloadAction<StorableUser>) => {
      state.blockchain = { ...state.blockchain, ...action.payload };
    },
    setIsUserInHub: (state, action: PayloadAction<Principal | null>) => {
      const principal = (deserify(action.payload, customSerify) as Principal).toText()
      localStorage.setItem("userHub", principal);
      state.userHub = action.payload;
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
    selectUserHub: (userState: UserState) => {
      if (userState.userHub) return userState.userHub;
      const userHub = localStorage.getItem("userHub");
      if (userHub) return serify(userHub, customSerify)
      return null;
    },
  },
});

export const {
  setDiscordIntegrationData,
  setUserBlockchainData,
  setIsUserInHub,
  clearDiscordIntegrationData,
  setDiscordGuilds,
} = userSlice.actions;
export const { selectUserDiscordData, selectUserBlockchainData, selectUserHub } =
  userSlice.selectors;
export default userSlice.reducer;
