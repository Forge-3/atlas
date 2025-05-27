import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space";
import { useDispatch, useSelector } from "react-redux";
import { customSerify, type RootState } from "../../store/store";
import { deserify } from "@karmaniverous/serify-deserify";
import type { Task as TaskType } from "../../../../declarations/atlas_space/atlas_space.did";
import { useEffect } from "react";
import { useUnAuthAtlasSpaceActor } from "../../hooks/identityKit";
import { getAtlasSpace, getSpaceTasks } from "../../canisters/atlasSpace/api";
import GenericTask from "./tasks/GenericTask";
import { FaWallet } from "react-icons/fa";

const Task = () => {
  const { spacePrincipal, taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const principal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  if (!principal) return <></>;
  const spaceId = principal.toString();

  const space = useSelector(
    (state: RootState) => state.spaces?.spaces?.[principal.toString()] ?? null
  );
  const tasks = space?.tasks
    ? (deserify(space?.tasks, customSerify) as {
        [key: string]: TaskType;
      })
    : null;
  const spaceData = space?.state;
  const unAuthAtlasSpace = useUnAuthAtlasSpaceActor(principal);

  useEffect(() => {
    if (!unAuthAtlasSpace || spaceData) return;
    getAtlasSpace({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, unAuthAtlasSpace, spaceData, principal]);

  useEffect(() => {
    if (!unAuthAtlasSpace || tasks) return;
    getSpaceTasks({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, unAuthAtlasSpace, tasks, principal]);

  if (!tasks || !taskId) return <></>;
  const currentTask = tasks[taskId];

  if (!spaceData || !currentTask) {
    return <></>;
  }

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <div className="relative w-full rounded-xl bg-[#1E0F33]/60 mb-1 h-[1000px]">
          <div className="px-16 py-12">
            <div className="flex items-center gap-4">
              <div className="bg-white flex rounded-2xl w-fit h-fit flex-none">
                {spaceData.space_logo ? (
                  <img
                    src={spaceData.space_logo}
                    draggable="false"
                    className="rounded-2xl m-1 w-16 h-16"
                  />
                ) : (
                  <div className="bg-[#4A0295] rounded-3xl m-1 w-16 h-16"></div>
                )}
              </div>
              <div>
                <h2 className="text-3xl font-semibold font-montserrat flex text-white">
                  {spaceData?.space_name}
                </h2>
              </div>
            </div>
            <div className="mx-2">
              <div className="h-1 w-full bg-white/20 mt-6 mb-8 rounded-full"></div>
              <div>
                <h2 className="text-4xl font-semibold font-montserrat flex text-white">
                  {currentTask.task_title}
                </h2>
                <div className="mt-6">
                  {currentTask.tasks.map((task, key) => (
                    <GenericTask
                      key={key}
                      genericTask={task.GenericTask}
                      spacePrincipal={principal}
                      taskId={taskId}
                      subtaskId={key}
                    />
                  ))}
                </div>
                <div className="flex mt-3 items-center justify-center">
                  <div className="mr-4">
                    <div className="bg-[#1E0F33] p-1 w-[32px] h-[32px] rounded-lg relative">
                      {/* TODO: add reward receive */}
                      {/* <img
                        src="/icons/check-in-box.svg"
                        className="w-6 h-6 relative"
                      /> */}
                    </div>
                  </div>
                  <div className="bg-[#9173FF] rounded-xl p-6 text-lg font-medium font-poppins w-full flex items-center justify-between">
                    <div>Reward</div>
                    <FaWallet color="1E0F33"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task;
