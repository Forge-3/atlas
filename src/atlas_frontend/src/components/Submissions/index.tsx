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
import { Principal } from "@dfinity/principal";
import type { TaskData, TasksData } from "../../canisters/atlasSpace/types";
import type { Space } from "../../store/slices/spacesSlice";
import { FaArrowLeftLong } from "react-icons/fa6";
import { getTaskPath } from "../../router/paths";
import GenericTaskSummation from "./GenericTaskSummation";
import DiscordTaskSummation from "./DiscordTaskSummation";
import Button from "../Shared/Button";

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
          <div className="flex justify-between my-4">
            <div className="flex justify-start gap-2">
              <Button
                light
                className="flex gap-2"
                onClick={() => navigate(getTaskPath(principal, taskId))}
              >
                <FaArrowLeftLong /> Back
              </Button>
            </div></div>

        <div className="relative w-full rounded-xl bg-[#1E0F33]/60 mb-1">
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
                  {currentTask.task_title}{" "}
                  <span className="text-[#9173FF] ml-2">(Submissions)</span>
                </h2>
              </div>
              <table className="table-auto mt-6 w-full text-white text-center rtl:text-right border-separate border-spacing-x-2 font-montserrat">
                <thead>
                  <tr>
                    <th scope="col" className="px-2 py-3"></th>
                    <th scope="col" className="px-4 py-3">
                      Principal
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Submitted
                    </th>
                    <th scope="col" className="px-4 py-3">
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
  const submissionState = usersSubmissions.getSubmissionState(userPrincipal);

  return (
    <>
      <tr onClick={() => setSummationOpen(!isSummationOpen)}>
        <th className="bg-[#9173FF]/50 px-2 py-3">
          <div
            className={`flex items-center justify-center ${!isSummationOpen && "-rotate-90"}`}
          >
            <TiArrowSortedDown />
          </div>
        </th>
        <th className="bg-[#9173FF]/50 px-4 py-3">
          {shortPrincipal(userPrincipal)}
        </th>
        <td className="bg-[#9173FF]/50 px-4 py-3">
          {Object.keys(currentTaskData).length}/{tasksCount}
        </td>
        <th
          className={`bg-[#9173FF]/50 px-4 py-3 ${
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
            const task = currentTask.tasks[Number(key)];
            if ('GenericTask' in task) {
              return (
                <GenericTaskSummation
                  key={key}
                  genericTask={task.GenericTask}
                  usersSubmissions={usersSubmissions}
                  submission={usersSubmissions.getSubmission(userPrincipal, key)}
                  authAtlasSpace={authAtlasSpace}
                  taskId={taskId}
                  subtaskId={key}
                  unAuthAtlasSpace={unAuthAtlasSpace}
                  spaceId={spaceId}
                  submissionState={submissionState}
                  user={userPrincipal}
                />
              );
            }
            if ('DiscordTask' in task) {
              return (
                <DiscordTaskSummation
                  key={key}
                  discordTask={task.DiscordTask}
                  usersSubmissions={usersSubmissions}
                  submission={usersSubmissions.getSubmission(userPrincipal, key)}
                  authAtlasSpace={authAtlasSpace}
                  taskId={taskId}
                  subtaskId={key}
                  unAuthAtlasSpace={unAuthAtlasSpace}
                  spaceId={spaceId}
                  submissionState={submissionState}
                  user={userPrincipal}
                />
              );
            }
            console.warn(`Unknown task type for key ${key}:`, task);
            return null;
          })}
          </td>
        </tr>
      )}
    </>
  );
};


export default Submissions;
