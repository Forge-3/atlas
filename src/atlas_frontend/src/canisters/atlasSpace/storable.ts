import type {
  State,
} from "../../../../declarations/atlas_space/atlas_space.did";
import type { StorableState } from "./types";

export const storableState = (state: State): StorableState => {
  const externalLinksObj = Object.fromEntries(state.external_links)

  return {
    ...state,
    space_symbol: state.space_symbol.pop() ?? null,
    space_background: state.space_background.pop() ?? null,
    space_logo: state.space_logo.pop() ?? null,
    external_links: {
      x: externalLinksObj?.x ?? null,
      telegram: externalLinksObj?.telegram ?? null,
      discord: externalLinksObj?.discord ?? null,
      linkedIn: externalLinksObj?.linkedIn ?? null,
    }
  };
};