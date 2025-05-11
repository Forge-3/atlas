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
import { setSpace } from "../../../store/slices/appSlice";
import SpaceItem from "./SpaceItem";
import { SPACE_PATH } from "../../../router";
import { useNavigate } from "react-router-dom";

const SpacesList = () => {
  const dispatch = useDispatch();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const spaces = useSelector((state: RootState) => state.app.spaces);
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
      getUnAuthAtlasSpaceActor(agent, Principal.from(spaceId));
      const unAuthAtlasSpaceActor = getUnAuthAtlasSpaceActor(
        agent,
        Principal.from(spaceId)
      );
      if (!unAuthAtlasSpaceActor) return;
      const state = await getAtlasSpace({
        unAuthAtlasSpaceActor,
      });
      dispatch(
        setSpace({
          state,
          spaceId,
        })
      );
    });
    setFetchedSpacesData(true);
  }, [dispatch, spaces, fetchedSpacesData]);

  if (!spaces) {
    if (!fetchingInProgress) navigate("/");
    return <></>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 container mx-auto my-4">
      {Object.entries(spaces).map(
        ([key, value]) =>
          value && (
            <a key={key} href={SPACE_PATH.replace(":spacePrincipal", key)}>
              <SpaceItem
                name={value.space_name}
                description={value.space_description}
                symbol={value.space_symbol}
                backgroundImg={value.space_background}
                avatarImg={value.space_logo}
              />
            </a>
          )
      )}
    </div>
  );
};

export default SpacesList;
