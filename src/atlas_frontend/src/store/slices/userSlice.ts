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
    discord: {
      accessToken: string | null;
      userData: UserData | null;
    };
  };
  userHub: string | null;
}

const initialState = (): UserState => {
  const accessToken = localStorage.getItem("discordUserAccessToken");
  const userData = localStorage.getItem("discordUserData");

  return {
    userHub: null,
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
      //const principal = (serify(action.payload, customSerify) as Principal).toText()
      //localStorage.setItem("discordUserData", (action.payload));
      state.integrations.discord.userData = action.payload;
    },
    setUserDiscordAccessToken: (state, action: PayloadAction<string>) => {
      localStorage.setItem("discordUserAccessToken", action.payload);
      state.integrations.discord.accessToken = action.payload;
    },
    setUserBlockchainData: (state, action: PayloadAction<StorableUser>) => {
      state.blockchain = { ...state.blockchain, ...action.payload };
    },
    setIsUserInHub: (state, action: PayloadAction<string | null>) => {
      if (!action.payload) return;
      console.log(12314, action.payload)
      localStorage.setItem("userHub", action.payload);
      state.userHub = action.payload;
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
    selectUserHub: (userState: UserState) => {
      if (userState.userHub) return userState.userHub;
      return localStorage.getItem("userHub");
    },
  },
});

export const {
  setUserDiscordData,
  setUserDiscordAccessToken,
  setUserBlockchainData,
  setIsUserInHub,
} = userSlice.actions;
export const { selectUserDiscordData, selectUserBlockchainData, selectUserHub } =
  userSlice.selectors;
export default userSlice.reducer;
