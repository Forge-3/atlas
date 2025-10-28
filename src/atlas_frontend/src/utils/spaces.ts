import type { Spaces } from "../store/slices/spacesSlice";
import { shortPrincipal } from "./icp";

export function resolveSpaceName(spaces: Spaces | null, spacePrincipal: string) {
    if (!spaces) return shortPrincipal(spacePrincipal)
    return spaces[spacePrincipal]?.state?.space_name ?? shortPrincipal(spacePrincipal)
}