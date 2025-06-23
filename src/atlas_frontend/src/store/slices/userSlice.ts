import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserData } from "../../integrations/discord.ts";
import type {
  Integrations,
  Rank,
  User,
} from "../../../../declarations/atlas_main/atlas_main.did.js";
import { deserify } from "@karmaniverous/serify-deserify";
import { customSerify } from "../store.ts";
import type { UserTransactions } from "../../canisters/ckUsdcIndex/types.ts";

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
  txs: UserTransactions;
  balances: {
    ckUsdc: bigint | null;
  };
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
    txs: {},
    balances: {
      ckUsdc: null,
    },
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
    setUserBlockchainData: (state, action: PayloadAction<StorableUser>) => {
      state.blockchain = { ...state.blockchain, ...action.payload };
    },
    setIsUserInHub: (state, action: PayloadAction<string | null>) => {
      if (!action.payload) return;
      console.log(12314, action.payload);
      localStorage.setItem("userHub", action.payload);
      state.userHub = action.payload;
    },
    setCkUsdcBalance: (state, action: PayloadAction<bigint>) => {
      state.balances.ckUsdc = action.payload;
    },
    appendUserTxs: (state, action: PayloadAction<UserTransactions>) => {
      state.txs = {
        ...state.txs,
        ...action.payload,
      };
    },
  },
  selectors: {
    selectUserBlockchainData: (userState: UserState) => {
      if (!userState.blockchain) return null;
      return new BlockchainUser(userState.blockchain);
    },
    selectUserHub: (userState: UserState) => {
      if (userState.userHub) return userState.userHub;
      return localStorage.getItem("userHub");
    },
    selectUserCkUsdc: (userState: UserState): bigint | null => {
      if (userState.balances.ckUsdc)
        return deserify(userState.balances.ckUsdc, customSerify) as bigint;
      return null;
    },
    selectUserTxs: (userState: UserState) => {
      return deserify(userState.txs, customSerify) as UserTransactions;
    },
  },
});

export const {
  setUserBlockchainData,
  setIsUserInHub,
  setCkUsdcBalance,
  appendUserTxs,
} = userSlice.actions;
export const {
  selectUserBlockchainData,
  selectUserHub,
  selectUserCkUsdc,
  selectUserTxs,
} = userSlice.selectors;
export default userSlice.reducer;
