import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Integrations,
  Rank,
  CandidUser,
  Space,
} from "../../../../declarations/atlas_main/atlas_main.did.js";
import { deserify } from "@karmaniverous/serify-deserify";
import { customSerify } from "../store.ts";
import type { UserTransactions } from "../../canisters/ckUsdcIndex/types.ts";
import type { Principal } from "@dfinity/principal";

export class BlockchainUser implements Omit<CandidUser, 'in_hub'> {
  public integrations: Integrations;
  public rank: Rank;
  public space_creation_in_progress: boolean;
  public belonging_to_spaces: Space[];
  public owned_spaces: Space[];
  public in_hub: Space | null

  constructor(public user: CandidUser) {
    this.integrations = user.integrations;
    this.rank = user.rank;
    this.space_creation_in_progress = user.space_creation_in_progress;
    this.belonging_to_spaces = user.belonging_to_spaces;
    this.owned_spaces = user.owned_spaces;
    this.in_hub = user.in_hub.pop() ?? null
  }

  belongingToAnySpace() {
    return this.belonging_to_spaces.length > 0
  }

  belongingToSpace(space: Principal) {
    return this.belonging_to_spaces.some(({id}) => id.toString() === space.toString())
  }

  ownSpaces(space: Principal) {
    return this.owned_spaces.some(({id}) => id.toString() === space.toString())
  }

  getRank() {
    return Object.keys(this.user.rank)[0] as keyof Rank;
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
  blockchain: CandidUser | null;
  userHub: string | null;
}

const initialState = (): UserState => {
  return {
    txs: {},
    balances: {
      ckUsdc: null,
    },
    userHub: null,
    blockchain: null,
  };
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserBlockchainData: (state, action: PayloadAction<CandidUser>) => {
      state.blockchain = { ...state.blockchain, ...action.payload };
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
      return new BlockchainUser(
        deserify(userState.blockchain, customSerify) as CandidUser
      );
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
  setCkUsdcBalance,
  appendUserTxs,
} = userSlice.actions;
export const {
  selectUserBlockchainData,
  selectUserCkUsdc,
  selectUserTxs,
} = userSlice.selectors;
export default userSlice.reducer;
