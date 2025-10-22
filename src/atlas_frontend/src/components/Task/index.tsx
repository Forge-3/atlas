import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space";
import { useDispatch, useSelector } from "react-redux";
import type { ClosedTask } from "../../../../declarations/atlas_space/atlas_space.did";
import { deserialize, type RootState } from "../../store/store";
import { useEffect } from "react";
import {
  useAuthAtlasSpaceActor,
  useUnAuthAtlasSpaceActor,
} from "../../hooks/identityKit";
import {
  closeTask,
  deleteClosedTask,
  forceExpireTask,
  getAtlasSpace,
  getSpaceTasks,
  withdrawReward,
  type AnyTask,
  type ExpiredTask,
} from "../../canisters/atlasSpace/api";
import GenericTask from "./tasks/GenericTask";
import TimeRemaining from "./TimeRemaining";
import { useAuth } from "@nfid/identitykit/react";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice";
import Button from "../Shared/Button";
import SpaceHeader from "../Shared/SpaceHeader";
import { getEditTaskPath, getSpacePath, getTaskPath } from "../../router/paths";
import {
  getUsersSubmissions,
  UserSubmissions,
} from "../../canisters/atlasSpace/tasks";
import toast from "react-hot-toast";
import { deleteTask, type Space } from "../../store/slices/spacesSlice";
import { getErrorWithInfoToast } from "../../utils/errors";
import {
  bigintToDate,
  formatDateShortHour,
  formatDateShortMonth,
  nowInSeconds,
} from "../../utils/date";
import Calendar from "../../icons/calendar.svg?react";
import { getTaskType } from "../../utils/tasks";
import InfoBox from "../Space/TaskCard/InfoBox";
import { runWithLoading } from "../../utils/loading";
import { RiWalletFill } from "react-icons/ri";
import { formatUnits } from "ethers";
import { DECIMALS } from "../../canisters/ckUsdcLedger/constans";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

const Task = () => {
  const { spacePrincipal, taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const [time, setTime] = useState(nowInSeconds());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(nowInSeconds());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;
  const inHub = userInfo?.in_hub ?? null;
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

    const ongoingTaskIds = useMemo(() => {
    return Object.entries(tasks ?? {})
      .filter(([, task]) => getTaskType(task, time) === "ongoing")
      .sort(([, a], [, b]) => {
        const left = Number(a.start_time);
        const right = Number(b.start_time);
        return left - right;
      })
      .map(([id]) => id);
  }, [tasks, time]);

  const currentIndex = taskId ? ongoingTaskIds.indexOf(taskId) : -1;
  const prevId = currentIndex > 0 ? ongoingTaskIds[currentIndex - 1] : null;
  const nextId =
    currentIndex >= 0 && currentIndex < ongoingTaskIds.length - 1
      ? ongoingTaskIds[currentIndex + 1]
      : null;
  
  const goToTask = (id: string) => {
    if (typeof getTaskPath === "function") {
      navigate(getTaskPath(parsedSpacePrincipal, id));
    }
  };

  if (!tasks || !taskId) return <></>;
  const currentTask = tasks[taskId];
  

  if (!spaceData || !currentTask) {
    return <></>;
  }

  function isClosedTask(task: AnyTask): task is ClosedTask {
    return "refunded" in task;
  }

  function isExpiredTask(task: AnyTask): task is ExpiredTask {
    return "expired" in task;
  }

  const taskDisabled =
    currentTask.start_time > BigInt(time) || isClosedTask(currentTask);

  const taskExpired = isExpiredTask(currentTask);
  const taskClosed = isClosedTask(currentTask);

  const usersSubmissions = currentTask?.tasks
    ? getUsersSubmissions(currentTask.tasks)
    : new UserSubmissions({});

  if (!user?.principal) return <></>;
  const isAccepted = usersSubmissions.isAccepted(user.principal.toText());
  const userAlreadyRewarded = currentTask.rewarded
      .map((p) => p.toText())
      .includes(user.principal.toText());

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

  const expireTask = async () => {
    if (!authAtlasSpace || !taskId) return;

    if (
      !window.confirm(
        "Are you sure you want to forcefully expire this task? This action cannot be undone."
      )
    ) {
      return;
    }

    await runWithLoading(async () => {
      await toast.promise(
        forceExpireTask({
          authAtlasSpace,
          taskId: BigInt(taskId),
        }),
        {
          loading: "Expiring task...",
          success: "Task expired successfully.",
          error: getErrorWithInfoToast("Failed to expire task."),
        }
      );

      await getSpaceTasks({
        unAuthAtlasSpace,
        spaceId,
        dispatch,
      });
    }, dispatch);

    navigate(getSpacePath(parsedSpacePrincipal));
  };

  const closeExpiredTask = async () => {
    if (!authAtlasSpace || !taskId) return;

    if (
      !window.confirm(
        "Are you sure you want to close this task? This action cannot be undone."
      )
    ) {
      return;
    }

    await runWithLoading(async () => {
      await toast.promise(
        closeTask({
          authAtlasSpace,
          taskId: BigInt(taskId),
        }),
        {
          loading: "Closing task...",
          success: "Task closed successfully.",
          error: getErrorWithInfoToast("Failed to close task."),
        }
      );

      await getSpaceTasks({
        unAuthAtlasSpace,
        spaceId,
        dispatch,
      });
    }, dispatch);

    navigate(getSpacePath(parsedSpacePrincipal));
  };

  const deleteCloseTask = async () => {
    if (!authAtlasSpace || !taskId) return;

    if (
      !window.confirm(
        "Are you sure you want to force close this task? This action cannot be undone."
      )
    ) {
      return;
    }
    await runWithLoading(async () => {
      await toast.promise(
        deleteClosedTask({
          authAtlasSpace,
          taskId: BigInt(taskId),
        }),
        {
          loading: "Closing task...",
          success: "Task closed successfully.",
          error: getErrorWithInfoToast("Failed to close task."),
        }
      );

      dispatch(deleteTask({
        spaceId,
        taskId
      }))
      await getSpaceTasks({
        unAuthAtlasSpace,
        spaceId,
        dispatch,
      });
    }, dispatch);

    navigate(getSpacePath(parsedSpacePrincipal));
  };

  const startTime = bigintToDate(currentTask.start_time);
  const endTime = bigintToDate(currentTask.end_time);
  const type = getTaskType(currentTask, time);

  const rewardAmount = formatUnits(currentTask.token_reward.CkUsdc.amount, DECIMALS);

  return (
    <div className={`w-full ${didUserCanAdministrate ? 'bg-background' : 'bg-dark'}`}>
        <SpaceHeader
          spaceName={spaceData.space_name}
          spaceDescription={spaceData.space_description}
          spaceLogo={spaceData.space_logo}
          spaceBackground={spaceData.space_background}
          externalLinks={spaceData.external_links}
          userInfo={userInfo}
          spacePrincipal={parsedSpacePrincipal}
        />
        <div className="w-full h-[1px] bg-primary mb-4"/>
        <div className="flex flex-row md:flex-none md:w-auto md:gap-none my-4 mx-6 justify-center md:justify-between font-montserrat text-[12px] md:text-base">
          <div className="w-full grid grid-flow-col auto-cols-max 
          gap-2 sm:flex sm:items-center justify-between"
          >
            <div className="flex mr-auto w-full">
              {didUserCanAdministrate ? (
                <Button
                  variant="dark"
                  className="gap-2 px-2 w-[108px] whitespace-nowrap sm:w-[120px]"
                  onClick={() => navigate(getSpacePath(parsedSpacePrincipal))}
                >
                  All Missions
                </Button>
              ) : (
                <Button
                  variant="vivid"
                  className="gap-2 px-2 w-[108px] whitespace-nowrap sm:w-[120px]"
                  onClick={() => navigate(getSpacePath(parsedSpacePrincipal))}
                >
                  All Missions
                </Button>
              )}
            </div>
            <div className="contents sm:hidden sm:gap-2 sm:ml-auto">
              {prevId && (
              <Button
                variant="publish"
                className="px-2 sm:px-4 w-12"
                onClick={() => prevId && goToTask(prevId)}
              >
                <FaAngleLeft className="h-3"/>
                
              </Button>
              )}
              {nextId && (
              <Button
                variant="publish"
                className="px-2 sm:px-4 w-12"
                onClick={() => nextId && goToTask(nextId)}
              >
                
                <FaAngleRight className="h-3"/>
              </Button>
              )}
            </div>
             <div className="hidden sm:flex sm:gap-2 sm:ml-auto">
              {prevId && (
              <Button
                variant="publish"
                className="px-2 sm:px-4 w-20 sm:w-[120px]"
                onClick={() => prevId && goToTask(prevId)}
              >
                <FaAngleLeft className="h-3"/>
                Previous
              </Button>
              )}
              {nextId && (
              <Button
                variant="publish"
                className="px-2 sm:px-4 w-20 sm:w-[120px]"
                onClick={() => nextId && goToTask(nextId)}
              >
                Next
                <FaAngleRight className="h-3"/>
              </Button>
              )}
            </div>
            <div className="flex flex-1">
              {didUserCanAdministrate && !taskDisabled && !taskExpired && (
                <Button
                  className="whitespace-nowrap px-4 sm:ml-2 text-white bg-rose-800 w-[108px] sm:w-auto"
                  onClick={expireTask}
                >
                  Force task expire
                </Button>
              )}
              {didUserCanAdministrate && !taskDisabled && taskExpired && (
                <Button
                  className="whitespace-nowrap px-4 sm:ml-2 text-white bg-rose-800 w-[93px] sm:w-auto"
                  onClick={closeExpiredTask}
                >
                  Close task
                </Button>
              )}
              {didUserCanAdministrate  && taskClosed && (
                <Button
                  className="whitespace-nowrap px-4 sm:ml-2 text-white bg-rose-800 w-[93px] sm:w-auto"
                  onClick={deleteCloseTask}
                >
                  Delete task
                </Button>
              )}
            </div>
          </div>
          
        </div>
        <div className="w-full h-[1px] bg-primary mb-4"/>
        <div className="flex flex-col-reverse md:flex-row w-full md:py-8">
          <div className="flex flex-col w-full px-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center w-full mt-4 md:mt-0">
              <h2 className="text-h3 md:text-h2 font-medium mt-4 md:my-0 font-montserrat text-white break-words">
                {currentTask.task_title}
              </h2>
              {didUserCanAdministrate && !taskExpired && !taskClosed && (
                <Button
                  className="mt-4 sm:mt-0 sm:ml-4 whitespace-nowrap px-4 text-white bg-blue-700"
                  onClick={() => navigate(getEditTaskPath(parsedSpacePrincipal, taskId))}
                >
                  Edit mission
                </Button>
              )}
            </div>
            <div className="bg-black/20 rounded-md lg:min-w-[640px] px-3 md:px-6 py-3 md:py-4 w-full text-white mt-4 flex items-start gap-2 md:gap-4 font-montserrat">
              <Calendar className="h-5 lg:self-center" />
              <div className="flex flex-row w-full gap-2 justify-between">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2">
                  <p className="font-medium md:mr-2 flex-none w-12">Starts:</p>
                  <div className="bg-primary flex-1 rounded-lg py-1 px-2 min-w-[120px]">
                    {formatDateShortMonth(startTime)}
                  </div>
                  <div className="bg-primary/20 rounded-lg py-1 px-2 flex-none min-w-[120px] lg:min-w-10">
                    {formatDateShortHour(startTime)}
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2">
                  <p className="font-medium md:mr-2 flex-none w-12">Ends:</p>
                  <div className="bg-primary flex-1 rounded-lg py-1 px-2 min-w-[120px]">
                    {formatDateShortMonth(endTime)}
                  </div>
                  <div className="bg-primary/20 rounded-lg py-1 px-2 flex-none min-w-[120px] lg:min-w-10">
                    {formatDateShortHour(endTime)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div>
                <div className="mt-8">
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
                      authAtlasSpace={authAtlasSpace}
                      isAdmin={didUserCanAdministrate}
                    />
                  ))}
                </div>
                <div className="flex mt-4 sm:mt-8 items-start justify-center">
                  <div className="mr-2 md:mr-8">
                    <div className="bg-black/20 flex justify-center items-center w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] rounded-lg relative">
                      {isAccepted && (
                        <img
                          src="/icons/check-in-box.svg"
                          className="w-5 h-5 sm:w-6 sm:h-6 relative"
                        />
                      )}
                    </div>
                  </div>
                  <div className={`${didUserCanAdministrate ? 'bg-black/20' : 'bg-background'} rounded-lg text-light p-3 mb-4 md:p-6 md:text-h3 font-medium font-montserrat w-full flex items-center justify-between`}>
                    <div>Reward</div>
                    <RiWalletFill className="h-5 w-6 md:h-7 md:w-8" />
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
          <div className="flex flex-col w-auto  max-h-min bg-black/20 p-4 md:p-8 rounded-lg mx-6 sm:self-start ">
            <div className="flex flex-col xl:flex-row justify-between">
              {type === "ongoing" && (
                <div className="mb-2 w-full">
                  <div className="flex flex-col w-full xl:flex-row xl:items-baseline xl:gap-2 justify-between">
                    <h3 className="font-montserrat text-light text-[20px] md:text-h3">
                      Time Remaining
                    </h3>
                    <TimeRemaining endTime={currentTask.end_time} currentTime={time} />
                  </div>
                </div>
              )}
              {type === "starting" && (
                <div className="mb-2 w-full">
                  <div className="flex flex-col xl:flex-row xl:items-baseline xl:gap-2 justify-between">
                    <h3 className="font-montserrat text-light text-[20px] md:text-h3">
                      Starts in
                    </h3>
                    <TimeRemaining endTime={currentTask.start_time} currentTime={time} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col xl:flex-row justify-between font-montserrat">
              <h3 className="text-light text-[20px] md:text-h3 xl:my-4 font-semibold">
              Rewards
              </h3>
              <div className="flex gap-3">
                {/* <h5 className="bg-[#E0D6FE] text-[14px] md:text-base text-black rounded-md items-center font-medium flex my-2 px-3 md:my-3 md:px-4">
                1500 Points
                </h5> */}
                <h5 className="bg-primary text-[14px] md:text-base text-light rounded-md items-center font-medium flex my-2 px-3 md:my-3 md:px-4">
                {rewardAmount} USDC
                </h5>
              </div>
            </div>
            <div className="bg-primary md:w-full md:h-48 lg:h-[220px] lg:w-[220px] xl:h-[376px] xl:w-[365px] rounded-lg mt-4">
              <div className="text-xl font-semibold font-montserrat p-6 text-white">
                <InfoBox
                  type={type}
                  startingLabel="Starting soon"
                />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Task;
