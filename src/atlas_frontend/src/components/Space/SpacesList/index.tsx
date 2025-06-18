import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getUnAuthAtlasSpaceActor,
  useUnAuthAgent,
  useUnAuthAtlasMainActor,
} from "../../../hooks/identityKit";
import { getAllSpaces } from "../../../canisters/atlasMain/api";
import type { RootState } from "../../../store/store";
import { Principal } from "@dfinity/principal";
import { getAtlasSpace } from "../../../canisters/atlasSpace/api";
import SpaceItem from "./SpaceItem";
import { useNavigate } from "react-router-dom";
import { getSpacePath } from "../../../router/paths";

const SpacesList = () => {
  const dispatch = useDispatch();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const spaces = useSelector((state: RootState) => state.spaces.spaces);
  const [fetchedSpacesData, setFetchedSpacesData] = useState(false);
  const [fetchingInProgress, setFetchingInProgress] = useState(true);
  const agent = useUnAuthAgent();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      if (unAuthAtlasMain && !spaces) {
        await getAllSpaces({
          dispatch,
          unAuthAtlasMain,
        });
        setFetchingInProgress(false);
      }
    };
    fetchSpaces();
  }, [dispatch, unAuthAtlasMain]);

  useEffect(() => {
    if (!spaces || fetchedSpacesData || !agent) return;
    Object.keys(spaces).map(async (spaceId) => {
      const spacePrincipal = Principal.from(spaceId)
      getUnAuthAtlasSpaceActor(agent, spacePrincipal);
      const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(
        agent,
        spacePrincipal
      );
      if (!unAuthAtlasSpace) return;
      await getAtlasSpace({
        spaceId,
        unAuthAtlasSpace,
        dispatch
      });
    });
    setFetchedSpacesData(true);
  }, [dispatch, spaces, fetchedSpacesData]);

  if (!spaces) {
    if (!fetchingInProgress) navigate("/");
    return <></>;
  }

  const spacesEntries = Object.entries(spaces);
  if (spacesEntries.length > 0) {
    return (
      <div className="grid grid-cols-3 gap-2 container mx-auto my-4">
        {spacesEntries.map(
          ([key, value]) =>
            value?.state && (
              <a key={key} href={getSpacePath(Principal.from(key))}>
                <SpaceItem
                  name={value.state.space_name}
                  description={value.state.space_description}
                  backgroundImg={value.state.space_background}
                  avatarImg={value.state.space_logo}
                />
              </a>
            )
        )}
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center">
        <h1 className="text-white font-montserrat font-medium text-2xl mt-16">No spaces found</h1>
      </div>
    );
  }
};

export default SpacesList;
