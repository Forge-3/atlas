import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getUnAuthAtlasSpaceActor,
  useUnAuthAgent,
  useUnAuthAtlasMainActor,
} from "../../../hooks/identityKit";
import { getAllSpaces } from "../../../canisters/atlasMain/api";
import { deserialize, type AppDispatch, type RootState } from "../../../store/store";
import { Principal } from "@dfinity/principal";
import { getAtlasSpace } from "../../../canisters/atlasSpace/api";
import SpaceItem from "./SpaceItem";
import type { Spaces } from "../../../store/slices/spacesSlice";
import LocalBlurOverlay from "../../Shared/LocalBlurOverlay";
import {
  loadSpacesFromLocalStorage,
  saveSpacesToLocalStorage,
} from "../../../store/slices/spacesSlice";

const withLoading = async (fn: () => Promise<void>, set: (b: boolean) => void) => {
  set(true);
  try {
    await fn();
  } finally {
    set(false);
  }
};

const SpacesList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const agent = useUnAuthAgent();

  const spaces = deserialize<Spaces>(
    useSelector((state: RootState) => state.spaces.spaces)
  );

  const actorsReady = Boolean(unAuthAtlasMain && agent);
  const hasData = Object.keys(spaces ?? {}).length > 0;

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (hasData) return false;
    try {
      return localStorage.getItem("atlasSpaces") == null;
    } catch {
      return true;
    }
  });

  const bootedRef = useRef(false);
  const fetchedOnceRef = useRef(false);

  const fetchFromApi = async () => {
    if (!actorsReady) return;
    try {
      const spacesIDs = await getAllSpaces({ dispatch, unAuthAtlasMain: unAuthAtlasMain! });
      const ids = Object.keys(spacesIDs);

      await Promise.all(
        ids.map(async (spaceId) => {
          const principal = Principal.from(spaceId);
          const actor = getUnAuthAtlasSpaceActor(agent!, principal);
          if (!actor) return;
          await getAtlasSpace({ spaceId, unAuthAtlasSpace: actor, dispatch });
        })
      );
    } catch(error){
      console.error("Failed to load spaces data from localStorage:", error);    }
  };

  useEffect(() => {
    (async () => {
      if (!bootedRef.current) {
        bootedRef.current = true;

        let ls = { hasEntry: false, hasData: false };
        if (!hasData) {
          ls = await dispatch(loadSpacesFromLocalStorage());
        }

        const showNow  = hasData || ls.hasData || (ls.hasEntry && !ls.hasData);
        const fetchNow = !showNow && actorsReady;

        setIsLoading(!showNow);

        if (fetchNow) {
          fetchedOnceRef.current = true;
          await withLoading(fetchFromApi, setIsLoading);
          return;
        }
      }

      if (actorsReady && !fetchedOnceRef.current) {
        fetchedOnceRef.current = true;

        const hasLS = (() => {
          try {
            return localStorage.getItem("atlasSpaces") !== null;
          } catch {
            return false;
          }
        })();

        const block = !hasData && !hasLS;
        if (block) await withLoading(fetchFromApi, setIsLoading);
        else await fetchFromApi();
      }
    })();
  }, [actorsReady]);

  useEffect(() => {
    dispatch(saveSpacesToLocalStorage());
  }, [spaces, dispatch]);

  if (isLoading) return <LocalBlurOverlay isLoading={true} />;

  const entries = Object.entries(spaces ?? {});
  if (entries.length > 0) {
    return (
      <div className="grid grid-cols-3 gap-2 container mx-auto my-4">
        {entries.map(
          ([key, value]) =>
            value?.state && (
              <SpaceItem
                key={key}
                spacePrincipal={Principal.from(key)}
                name={value.state.space_name}
                description={value.state.space_description}
                backgroundImg={value.state.space_background}
                avatarImg={value.state.space_logo}
              />
            )
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <h1 className="text-white font-montserrat font-medium text-2xl mt-16">
        No spaces found
      </h1>
    </div>
  );
};

export default SpacesList;
