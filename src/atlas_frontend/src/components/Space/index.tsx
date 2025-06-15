import React, { useEffect } from "react";
import Space from "./Space.tsx";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAtlasSpace,
  getSpaceTasks,
} from "../../canisters/atlasSpace/api.ts";
import {
  getUnAuthAtlasSpaceActor,
  useUnAuthAgent,
} from "../../hooks/identityKit.ts";
import { useSpaceId } from "../../hooks/space.ts";
import { useDispatch, useSelector } from "react-redux";
import { customSerify, type RootState } from "../../store/store.ts";
import { deserify } from "@karmaniverous/serify-deserify";
import type { Task } from "../../../../declarations/atlas_space/atlas_space.did";

const SpacePage = () => {
  const dispatch = useDispatch();
  const { spacePrincipal } = useParams();
  const navigate = useNavigate();

  const principal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  if (!principal) return <></>;
  const spaceId = principal.toString();
  const space = useSelector(
    (state: RootState) => state.spaces?.spaces?.[principal.toString()] ?? null
  );
  const tasks = space?.tasks ? deserify(space?.tasks, customSerify) as {
    [key: string]: Task;
  } : null;
  const spaceData = space?.state;

  const agent = useUnAuthAgent();

  useEffect(() => {
    if (!agent || spaceData) return;
    const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, principal);
    getAtlasSpace({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, agent, spaceData, principal]);

  useEffect(() => {
    if (!agent || tasks) return;
    const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, principal);
    getSpaceTasks({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, agent, tasks, principal]);

  if (!spaceData) {
    return <></>;
  }

  return (
    <Space
      name={spaceData.space_name}
      description={spaceData.space_description}
      symbol={spaceData.space_symbol}
      backgroundImg={spaceData.space_background}
      avatarImg={spaceData.space_logo}
      tasks={tasks === null ? undefined : tasks}
    />
  );
};

export default SpacePage;
