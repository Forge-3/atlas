import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../../../declarations/atlas_space/atlas_space.did.js";
import { toast } from "react-hot-toast";

interface State {
  space_name: string;
  space_description: string;
  space_symbol: string | null;
  space_logo: string | null;
  space_background: string | null;
}

interface GetAtlasSpaceArgs {
  unAuthAtlasSpaceActor: ActorSubclass<_SERVICE>;
}

export const getAtlasSpace = async ({
  unAuthAtlasSpaceActor,
}: GetAtlasSpaceArgs) => {
  const promise = new Promise<State>(async (res, rej) => {
    const state = await unAuthAtlasSpaceActor
      .get_state()
      .catch((err) => rej(err));

    if (!state) return rej("Failed to get space state");

    res({
      ...state,
      space_symbol: state.space_symbol.pop() ?? null,
      space_background: state.space_background.pop() ?? null,
      space_logo: state.space_logo.pop() ?? null,
    });
  });

  return toast.promise(promise, {
    loading: "Loading a space...",
    success: "Successfully loaded the space",
    error: "Failed to load space",
  });
};
