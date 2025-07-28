import React from "react";
import {
  useAuthAtlasSpaceActor,
  useUnAuthAtlasSpaceActor,
} from "../../hooks/identityKit";
import type {
  _SERVICE,
  Task,
} from "../../../../declarations/atlas_space/atlas_space.did";
import { deserialize, type RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space";
import { useEffect, useState } from "react";
import {
  getAtlasSpace,
  getSpaceTasks,
} from "../../canisters/atlasSpace/api";
import {
  getUsersSubmissions,
  UserSubmissions,
} from "../../canisters/atlasSpace/tasks";
import { shortPrincipal } from "../../utils/icp";
import { TiArrowSortedDown } from "react-icons/ti";
import type { ActorSubclass } from "@dfinity/agent";
import type { TasksData } from "../../canisters/atlasSpace/types";
import type { Space } from "../../store/slices/spacesSlice";
import { getTaskPath } from "../../router/paths";
import Button from "../Shared/Button";
import TaskSummation from "./TaskSummation";
import { FaArrowLeftLong } from "react-icons/fa6";

const Submissions = () => {
  const { spacePrincipal, taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const principal = useSpaceId({ spacePrincipal, navigate });
  const spaceId = principal?.toString();

  const authAtlasSpace = principal ? useAuthAtlasSpaceActor(principal) : null;
  const unAuthAtlasSpace = principal
    ? useUnAuthAtlasSpaceActor(principal)
    : null;

  const space = principal
    ? deserialize<Space>(
        useSelector(
          (state: RootState) =>
            state.spaces?.spaces?.[principal.toString()] ?? null
        )
      )
    : null;

  const tasks = space?.tasks ? space.tasks : null;
  const spaceData = space?.state;

  useEffect(() => {
    if (spaceId && !spaceData && unAuthAtlasSpace) {
      getAtlasSpace({ spaceId, unAuthAtlasSpace, dispatch });
    }
  }, [dispatch, unAuthAtlasSpace, spaceData, spaceId]);

  useEffect(() => {
    if (spaceId && !tasks && unAuthAtlasSpace) {
      getSpaceTasks({ spaceId, unAuthAtlasSpace, dispatch });
    }
  }, [dispatch, unAuthAtlasSpace, tasks, spaceId]);

  const currentTask = taskId && tasks ? tasks[taskId] : null;
  const tasksCount = currentTask?.tasks?.length ?? 0;
  const usersSubmissions = currentTask?.tasks
    ? getUsersSubmissions(
        Object.fromEntries(
          currentTask.tasks.map((task, idx) => [idx.toString(), task])
        )
      )
    : new UserSubmissions({});

  if (
    !spaceId ||
    !taskId ||
    !principal ||
    !authAtlasSpace ||
    !unAuthAtlasSpace ||
    !spaceData ||
    !currentTask
  ) {
    return <></>;
  }
  console.log(usersSubmissions.userSubmissionsData)
  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <div className="w-full flex flex-col gap-2 md:flex-row md:flex-none md:w-auto md:gap-none my-4 md:justify-between">
          <div className="flex">
            <Button
              light
              className="flex-1 gap-2"
              onClick={() => navigate(getTaskPath(principal, taskId))}
            >
              <FaArrowLeftLong /> Back
            </Button>
          </div>
        </div>
        <div className="relative w-full rounded-xl bg-[#1E0F33]/60 mb-1 p-4 sm:p-8">
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
          <div className="mx-1 sm:mx-2">
            <div className="h-1 w-full bg-white/20 mt-4 mb-3 sm:mt-6 sm:mb-8 rounded-full"></div>
            <div>
              <h2 className="text-3l sm:text-4xl font-semibold font-montserrat flex text-white">
                {currentTask.task_title}{" "}
                <span className="text-[#9173FF] ml-2">(Submissions)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table-auto mt-6 w-full overflow-x-auto  text-white text-center rtl:text-right border-separate border-spacing-x-2 font-montserrat">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="px-2 py-3 text-xs sm:text-sm text-left w-8 rounded-tl-lg"
                    ></th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs sm:text-sm text-left w-1/3"
                    >
                      Principal
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs sm:text-sm text-center w-1/3"
                    >
                      Submitted
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3  text-xs sm:text-sm text-right w-1/3 rounded-tr-lg"
                    >
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(usersSubmissions.userSubmissionsData).map(
                    ([userPrincipal, tasks]) => (
                      <Summation
                        key={userPrincipal}
                        userPrincipal={userPrincipal}
                        currentTask={currentTask}
                        tasksCount={tasksCount}
                        usersSubmissions={usersSubmissions}
                        currentTaskData={tasks}
                        authAtlasSpace={authAtlasSpace}
                        taskId={taskId}
                        unAuthAtlasSpace={unAuthAtlasSpace}
                        spaceId={spaceId}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SummationProps {
  userPrincipal: string;
  tasksCount: number;
  usersSubmissions: UserSubmissions;
  currentTask: Task;
  currentTaskData: TasksData;
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: string;
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
}

const Summation = ({
  currentTask,
  usersSubmissions,
  userPrincipal,
  tasksCount,
  currentTaskData,
  authAtlasSpace,
  taskId,
  unAuthAtlasSpace,
  spaceId,
}: SummationProps) => {
  const [isSummationOpen, setSummationOpen] = useState(false);
  const submissionState = usersSubmissions.getSubmissionState(userPrincipal) as "Rejected" | "WaitingForReview" | "Accepted";

  return (
    <>
      <tr
        onClick={() => setSummationOpen(!isSummationOpen)}
        className="border-b border-gray-700 hover:bg-[#9173FF]/40 cursor-pointer transition-colors duration-200"
      >
        <td className="bg-[#9173FF]/30 px-2 py-2 sm:px-3 sm:py-3 text-center rounded-bl-lg">
          <div
            className={`flex items-center justify-center transition-transform duration-200 ${!isSummationOpen && "-rotate-90"}`}
          >
            <TiArrowSortedDown className="text-xl" />
          </div>
        </td>
        <td className="bg-[#9173FF]/30 px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm md:text-base text-left truncate max-w-[150px]">
          {shortPrincipal(userPrincipal)}
        </td>
        <td className="bg-[#9173FF]/30 px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm md:text-base text-center">
          {Object.keys(currentTaskData).length}/{tasksCount}
        </td>
        <th
          className={`bg-[#9173FF]/30 px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm md:text-base text-center rounded-br-lg ${
            submissionState === "Rejected" && "text-red-500"
          } ${submissionState === "Accepted" && "text-green-500"}`}
        >
          {submissionState}
        </th>
      </tr>
      {isSummationOpen && (
        <tr>
          <td colSpan={4} className="bg-[#9173FF]/30 px-4 py-3">
            {Object.entries(currentTaskData).map(([key]) => {
              const subtask = currentTask.tasks[Number(key)];

              const commonProps = {
                usersSubmissions: usersSubmissions,
                submission: usersSubmissions.getSubmission(userPrincipal, key),
                authAtlasSpace: authAtlasSpace,
                taskId: taskId,
                subtaskId: key,
                unAuthAtlasSpace: unAuthAtlasSpace,
                spaceId: spaceId,
                submissionState: submissionState,
                user: userPrincipal,
              };

              const task = "GenericTask" in subtask ? subtask.GenericTask : subtask.DiscordTask;

              if (task) {
                return (
                  <TaskSummation
                    key={key}
                    {...commonProps}
                    task={task}
                  />
                );
              }

              console.warn(`Unknown task type for key ${key}:`, subtask);
              return null;
            })}
          </td>
        </tr>
      )}
    </>
  );
};
export default Submissions;
