import { Principal } from "@dfinity/principal";
import toast from "react-hot-toast";
import type { NavigateFunction } from "react-router-dom";

interface UseSpaceIdParams {
    spacePrincipal: string | undefined,
    navigate: NavigateFunction
}

export const useSpaceId = ({spacePrincipal, navigate} : UseSpaceIdParams) => {
    if (!spacePrincipal) {
        toast.error("Failed to read space ID");
        navigate("/");
        return null;
      }
    
      try {
        return Principal.fromText(spacePrincipal);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {
        toast.error("Failed to read space ID");
        navigate("/");
        return null;
      }
}