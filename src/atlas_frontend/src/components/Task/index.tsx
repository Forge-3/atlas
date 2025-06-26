import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space";
import { useDispatch, useSelector } from "react-redux";
import { customSerify, type RootState } from "../../store/store";
import { deserify } from "@karmaniverous/serify-deserify";
import type { Task as TaskType } from "../../../../declarations/atlas_space/atlas_space.did";
import { useEffect } from "react";
import { useAuthAtlasSpaceActor, useUnAuthAtlasSpaceActor } from "../../hooks/identityKit";
import { getAtlasSpace, getSpaceTasks, withdrawReward } from "../../canisters/atlasSpace/api";
import GenericTask from "./tasks/GenericTask";
import { FaWallet } from "react-icons/fa";
import { useAuth } from "@nfid/identitykit/react";
import { selectUserBlockchainData, selectUserHub } from "../../store/slices/userSlice";
import Button from "../Shared/Button";
import { getSubmissionsPath } from "../../router/paths";
import {
  getUsersSubmissions,
  UserSubmissions,
} from "../../canisters/atlasSpace/tasks";
import toast from "react-hot-toast";

const Task = () => {
  const { spacePrincipal, taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userBlockchainData = useSelector(selectUserBlockchainData);

  const principal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  if (!principal) return <></>;
  const spaceId = principal.toString();
  const authAtlasSpace = useAuthAtlasSpaceActor(principal);
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
  const userInHub = useSelector(selectUserHub);
  const isUserInHub = userInHub === spacePrincipal

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

  const usersSubmissions = currentTask?.tasks
    ? getUsersSubmissions(currentTask.tasks)
    : new UserSubmissions({});

  if (!user?.principal) return <></>;
  const isAccepted = usersSubmissions.isAccepted(user.principal.toText());
  const userAlreadyRewarded = currentTask.rewarded.includes(user.principal)

  const withdraw = async () => {
    if (!authAtlasSpace) {
      navigate("/")
      return;
    }
    await toast.promise(withdrawReward({
      authAtlasSpace,
      taskId: BigInt(taskId)
    }), {
      loading: "Withdrawing funds...",
      success: "Funds withdrawn successfully.",
      error: "Failed to withdraw funds",
    });
  }

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        {user && userBlockchainData?.isSpaceLead() && (
          <div className="my-4 flex justify-end">
            <Button
              onClick={() => navigate(getSubmissionsPath(principal, taskId))}
            >
              Review submission
            </Button>
          </div>
        )}
        <div className="relative w-full rounded-xl bg-[#1E0F33]/60 mb-1">
          <div className=" px-2 py-2 sm:px-16 sm:py-12">
            <div className="flex items-center gap-4">
              <div className="bg-white flex rounded-2xl w-fit h-fit flex-none">
                {spaceData.space_logo ? (
                  <img
                    src={spaceData.space_logo}
                    draggable="false"
                    className="rounded-2xl m-0.5 w-12 h-12 sm:w-16 sm:h-16"
                  />
                ) : (
                  <div className="bg-[#4A0295] rounded-2xl m-0.5 w-12 h-12 sm:w-16 sm:h-16"></div>
                )}
              </div>
              <div>
                <h2 className="sm:text-3xl font-semibold font-montserrat flex text-white">
                  {spaceData?.space_name}
                </h2>
              </div>
            </div>
            <div className="mx-2">
              <div className="h-1 w-full bg-white/20 mt-3 mb-4 sm:mt-6 sm:mb-8 rounded-full"></div>
              <div>
                <h2 className="sm:text-4xl font-semibold font-montserrat flex text-white">
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
                      unAuthAtlasSpace={unAuthAtlasSpace}
                      isUserInHub={isUserInHub}
                    />
                  ))}
                </div>
                <div className="flex mt-3 items-center justify-center">
                  <div className="mr-3 sm:mr-4">
                    <div className="bg-[#1E0F33] p-2 mx-[1px] sm:mx-[0px] w-[16px] h-[16px] sm:w-[32px] sm:h-[32px] rounded sm:rounded-lg relative">
                      {isAccepted && (
                        <img
                          src="/icons/check-in-box.svg"
                          className="w-6 h-6 relative"
                        />
                      )}
                    </div>
                  </div>
                  <div className="bg-[#9173FF] rounded-xl p-2 sm:p-6 sm:text-lg font-medium font-poppins w-full flex items-center justify-between">
                    <div>Reward</div>
                    <FaWallet color="1E0F33" />
                  </div>
                </div>
                {isAccepted && !userAlreadyRewarded && (
                  <div className="flex justify-end mt-4">
                    <Button onClick={withdraw}>Withdraw reward</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Task;
