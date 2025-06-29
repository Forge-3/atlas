import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space";
import { useDispatch, useSelector } from "react-redux";
import type { ClosedTask } from "../../../../declarations/atlas_space/atlas_space.did";
import { deserialize, type RootState } from "../../store/store";
import { useEffect } from "react";
import {
  useAuthAtlasMainActor,
  useAuthAtlasSpaceActor,
  useUnAuthAtlasMainActor,
  useUnAuthAtlasSpaceActor,
} from "../../hooks/identityKit";
import {
  forceCloseTask,
  getAtlasSpace,
  getSpaceTasks,
  withdrawReward,
  type AnyTask,
} from "../../canisters/atlasSpace/api";
import GenericTask from "./tasks/GenericTask";
import { FaWallet } from "react-icons/fa";
import { useAuth } from "@nfid/identitykit/react";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice";
import Button from "../Shared/Button";
import { getSpacePath, getSubmissionsPath } from "../../router/paths";
import {
  getUsersSubmissions,
  UserSubmissions,
} from "../../canisters/atlasSpace/tasks";
import toast from "react-hot-toast";
import { getAtlasUser, joinAtlasSpace } from "../../canisters/atlasMain/api";
import type { Space } from "../../store/slices/spacesSlice";
import { FaArrowLeftLong } from "react-icons/fa6";
import { getErrorWithInfoToast } from "../../utils/errors";
import { nowInSeconds } from "../../utils/date";

const Task = () => {
  const { spacePrincipal, taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;
  const inHub = userInfo?.in_hub ?? null;
  const authAtlasMain = useAuthAtlasMainActor();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const parsedSpacePrincipal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  if (!parsedSpacePrincipal) return <></>;
  const spaceId = parsedSpacePrincipal.toString();
  const authAtlasSpace = useAuthAtlasSpaceActor(parsedSpacePrincipal);
  const space = deserialize<Space>(
    useSelector((state: RootState) => state.spaces?.spaces?.[spaceId] ?? null)
  );
  const tasks = space?.tasks ? space?.tasks : null;
  const spaceData = space?.state;
  const unAuthAtlasSpace = useUnAuthAtlasSpaceActor(parsedSpacePrincipal);
  const isUserInHub = inHub?.id.toString() === spacePrincipal;

  useEffect(() => {
    if (!unAuthAtlasSpace || spaceData) return;
    getAtlasSpace({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, unAuthAtlasSpace, spaceData, parsedSpacePrincipal]);

  useEffect(() => {
    if (!unAuthAtlasSpace || tasks) return;
    getSpaceTasks({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, unAuthAtlasSpace, tasks, parsedSpacePrincipal]);

  if (!tasks || !taskId) return <></>;
  const currentTask = tasks[taskId];

  if (!spaceData || !currentTask) {
    return <></>;
  }

  function isClosedTask(task: AnyTask): task is ClosedTask {
    return 'refunded' in task;
  }

  const taskDisabled = currentTask.start_time > BigInt(nowInSeconds()) || isClosedTask(currentTask);

  const usersSubmissions = currentTask?.tasks
    ? getUsersSubmissions(currentTask.tasks)
    : new UserSubmissions({});

  if (!user?.principal) return <></>;
  const isAccepted = usersSubmissions.isAccepted(user.principal.toText());
  const userAlreadyRewarded = currentTask.rewarded.includes(user.principal);

  const withdraw = async () => {
    if (!authAtlasSpace) {
      navigate("/");
      return;
    }
    await toast.promise(
      withdrawReward({
        authAtlasSpace,
        taskId: BigInt(taskId),
      }),
      {
        loading: "Withdrawing funds...",
        success: "Funds withdrawn successfully.",
        error: getErrorWithInfoToast("Failed to withdraw funds."),
      }
    );
  };

  const didUserCanAdministrate =
    userInfo?.canAdministrate(parsedSpacePrincipal) ?? false;

  const joinSpace = async () => {
    if (!authAtlasMain || !unAuthAtlasMain || !user) {
      return;
    }
    await toast.promise(
      joinAtlasSpace({
        authAtlasMain,
        space: parsedSpacePrincipal,
      }),
      {
        loading: "Trying to join space...",
        success: "Successfully joined to space.",
        error: getErrorWithInfoToast("Failed to join to space."),
      }
    );
    getAtlasUser({
      unAuthAtlasMain,
      dispatch,
      userId: user.principal,
    });
  };

  const closeTask = async () => {
    if (!authAtlasSpace || !taskId) return;

    await toast.promise(
      forceCloseTask({
        authAtlasSpace,
        taskId: BigInt(taskId),
      }),
      {
        loading: "Closing task...",
        success: "Task closed successfully.",
        error: getErrorWithInfoToast("Failed to close task."),
      }
    );

    navigate(getSpacePath(parsedSpacePrincipal));
  };

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <div className="w-full flex flex-col gap-2 md:flex-row md:flex-none md:w-auto md:gap-none my-4 md:justify-between">
          <div className="flex">
            <Button
              light
              className="flex-1 gap-2 md:flex-none"
              onClick={() => navigate(getSpacePath(parsedSpacePrincipal))}
            >
              <FaArrowLeftLong /> Back
            </Button>
          </div>
          <div className="flex md:flex-none">
            {!didUserCanAdministrate && userBlockchainData && !inHub && (
              <Button className="flex-1 md:flex-none" onClick={joinSpace}>Join space</Button>
            )}
            {didUserCanAdministrate && !taskDisabled && (
              <Button
                className="flex-1 md:flex-none"
                onClick={() =>
                  navigate(getSubmissionsPath(parsedSpacePrincipal, taskId))
                }
              >
                Review submission
              </Button>
            )}
            {didUserCanAdministrate && !taskDisabled && (
              <Button
                className="flex-1 md:flex-none ml-2 text-white bg-rose-800"
                onClick={closeTask}
              >
                Close task
              </Button>
            )}
          </div>
        </div>

        <div className="relative w-full rounded-xl bg-[#1E0F33]/60 mb-1">
          <div className=" px-2 py-2 md:px-16 md:py-12">
            <div className="flex items-center gap-4">
              <div className="bg-white flex rounded-2xl w-fit h-fit flex-none">
                {spaceData.space_logo ? (
                  <img
                    src={spaceData.space_logo}
                    draggable="false"
                    className="rounded-2xl m-0.5 w-12 h-12 md:w-16 md:h-16"
                  />
                ) : (
                  <div className="bg-[#4A0295] rounded-2xl m-0.5 w-12 h-12 md:w-16 md:h-16"></div>
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold font-montserrat flex text-white">
                  {spaceData?.space_name}
                </h2>
              </div>
            </div>
            <div className="mx-2">
              <div className="h-1 w-full bg-white/20 mt-3 mb-4 md:mt-6 md:mb-8 rounded-full"></div>
              <div>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-semibold font-montserrat flex text-white">
                  {currentTask.task_title}
                </h2>
                <div className="mt-6">
                  {currentTask.tasks.map((task, key) => (
                    <GenericTask
                      key={key}
                      genericTask={task.GenericTask}
                      spacePrincipal={parsedSpacePrincipal}
                      taskId={taskId}
                      subtaskId={key}
                      unAuthAtlasSpace={unAuthAtlasSpace}
                      isUserInHub={isUserInHub}
                      disabled={taskDisabled}
                    />
                  ))}
                </div>
                <div className="flex mt-3 items-center justify-center">
                  <div className="mr-3 md:mr-4">
                    <div className="bg-[#1E0F33] p-2 mx-[1px] md:mx-[0px] w-[16px] h-[16px] md:w-[32px] md:h-[32px] rounded md:rounded-lg relative">
                      {isAccepted && (
                        <img
                          src="/icons/check-in-box.svg"
                          className="w-6 h-6 relative"
                        />
                      )}
                    </div>
                  </div>
                  <div className="bg-[#9173FF] rounded-xl p-2 mb-2 md:p-6 sm:base md:text-lg md:font-medium font-poppins w-full flex items-center justify-between">
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
