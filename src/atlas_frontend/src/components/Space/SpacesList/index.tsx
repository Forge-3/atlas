import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getUnAuthAtlasSpaceActor,
  useUnAuthAgent,
  useUnAuthAtlasMainActor,
} from "../../../hooks/identityKit";
import { getAllSpaces } from "../../../canisters/atlasMain/api";
import { customSerify, deserialize, type RootState } from "../../../store/store";
import { Principal } from "@dfinity/principal";
import { getAtlasSpace } from "../../../canisters/atlasSpace/api";
import SpaceItem from "./SpaceItem";
import { useNavigate } from "react-router-dom";
import type { Spaces } from "../../../store/slices/spacesSlice";
import LocalBlurOverlay from "../../Shared/LocalBlurOverlay";
import { serify } from "@karmaniverous/serify-deserify";
import { setSpaces } from "../../../store/slices/spacesSlice";
import type { StorableState } from "../../../canisters/atlasSpace/types";

const SpacesList = () => {
  const dispatch = useDispatch();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const spaces = deserialize<Spaces>(
    useSelector((state: RootState) => state.spaces.spaces)
  );

  const [fetchingInProgress, setFetchingInProgress] = useState(true);
  const agent = useUnAuthAgent();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAndFetchSpaces = async () => {
      if (spaces && Object.keys(spaces).length > 1) {
        setFetchingInProgress(false);
        return;
      }
      try {
        const savedData = localStorage.getItem("atlasSpaces");
        if (savedData) {
          const loadedSpaces = JSON.parse(savedData);
          if (loadedSpaces && Object.keys(loadedSpaces).length > 0) {
            dispatch(setSpaces(loadedSpaces));
            setFetchingInProgress(false);
          }
        }
      } catch (error) {
        console.error("Failed to load spaces data from localStorage:", error);
      }

      if (unAuthAtlasMain && agent) {
        setFetchingInProgress(true);
        const spacesIDs = await getAllSpaces({
          dispatch,
          unAuthAtlasMain,
        });
        const updatedSpacesData: { [key: string]: { state: StorableState | null; tasks: null } } = {};
        const spaceIds = Object.keys(spacesIDs);

        for (const spaceId of spaceIds) {
          const spacePrincipal = Principal.from(spaceId);
          const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, spacePrincipal);
          if (!unAuthAtlasSpace) continue;

          const spaceData = await getAtlasSpace({
            spaceId,
            unAuthAtlasSpace,
            dispatch,
          });

          if (spaceData) {
            updatedSpacesData[spaceId] = {
              state: spaceData.state,
              tasks: null
            };
          }
        }

        if (Object.keys(updatedSpacesData).length > 0) {
          dispatch(setSpaces(updatedSpacesData));
          try {
            const serializedData = JSON.stringify(serify(updatedSpacesData, customSerify));
            localStorage.setItem("atlasSpaces", serializedData);
          } catch (error) {
            console.error("Failed to save spaces data to localStorage:", error);
          }
        }
        setFetchingInProgress(false);
      }
    };
    loadAndFetchSpaces();
  }, [dispatch, unAuthAtlasMain, spaces, agent]);

  if (!spaces) {
    if (!fetchingInProgress) navigate("/");
    return <LocalBlurOverlay isLoading={true} />;
  }

  const spacesEntries = Object.entries(spaces);
  if (spacesEntries.length > 0) {
    return (
      <div className="grid grid-cols-3 gap-2 container mx-auto my-4">
        {spacesEntries.map(
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
  } else {
    return (
      <div className="flex items-center justify-center">
        <h1 className="text-white font-montserrat font-medium text-2xl mt-16">
          No spaces found
        </h1>
      </div>
    );
  }
};

export default SpacesList;