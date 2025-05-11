import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../../../declarations/atlas_space/atlas_space.did.js";
import type { SimpleState } from "../../store/slices/appSlice.js";

interface GetAtlasSpaceArgs {
  unAuthAtlasSpaceActor: ActorSubclass<_SERVICE>;
}

export const getAtlasSpace = async ({
  unAuthAtlasSpaceActor,
}: GetAtlasSpaceArgs): Promise<SimpleState> => {
  const state = await unAuthAtlasSpaceActor.get_state();
  return {
    ...state,
    space_symbol: state.space_symbol.pop() ?? null,
    space_background: state.space_background.pop() ?? null,
    space_logo: state.space_logo.pop() ?? null,
  }
};
