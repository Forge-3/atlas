import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../../../declarations/atlas_main/atlas_main.did.js";
import { toast } from "react-hot-toast";
import { formatErrorMsg } from "./errors";
import type { Principal } from "@dfinity/principal";

export const createNewSpace = async (
  authenticatedAtlasBackend: ActorSubclass<_SERVICE>,
  name: string,
  description: string,
  symbol: string | null,
  logo: string | null,
  background: string | null
) => {
  const promise = new Promise<Principal>(async (res, rej) => {
    const userData = await authenticatedAtlasBackend.create_new_space(
      name,
      description,
      symbol ? [symbol] : [],
      logo ? [logo] : [],
      background ? [background] : []
    );
    if ("Ok" in userData) {
        res(userData.Ok)

    } else if ("Err" in userData) {
        console.error(userData.Err)
        rej(formatErrorMsg(userData.Err))
    }
  });

  return toast.promise(promise,   
    {
        loading: 'Creating new space...',
        success: "Space created successfully",
        error: "Failed to create space",
      }
  )

};
