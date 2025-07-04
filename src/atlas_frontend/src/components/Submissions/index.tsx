import React from "react";
import {
  useAuthAtlasSpaceActor,
  useUnAuthAtlasSpaceActor,
} from "../../hooks/identityKit";
import type {
  _SERVICE,
  TaskType,
} from "../../../../declarations/atlas_space/atlas_space.did";
import { deserialize, type RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space";
import { useEffect, useState } from "react";
import {
  acceptSubtaskSubmission,
  getAtlasSpace,
  getSpaceTasks,
  rejectSubtaskSubmission,
  type AnyTask,
} from "../../canisters/atlasSpace/api";
import {
  getUsersSubmissions,
  UserSubmissions,
} from "../../canisters/atlasSpace/tasks";
import { shortPrincipal } from "../../utils/icp";
import { TiArrowSortedDown } from "react-icons/ti";
import Button from "../Shared/Button";
import type { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { TaskData, TasksData } from "../../canisters/atlasSpace/types";
import type { Space } from "../../store/slices/spacesSlice";
import { FaArrowLeftLong } from "react-icons/fa6";
import { getTaskPath } from "../../router/paths";
import { useForm, type SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { runWithLoading } from "../../utils/loading";

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
  const tasksCount = currentTask?.tasks.length ?? 0;
  const usersSubmissions = currentTask?.tasks
    ? getUsersSubmissions(currentTask.tasks)
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

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <div className="w-full flex flex-col gap-2 md:flex-row md:flex-none md:w-auto md:gap-none my-4 md:justify-between">
          <div className="flex">
            <Button
              variant="light"
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
  currentTask: AnyTask;
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
          <td
            colSpan={4}
            className="bg-[#9173FF]/20 px-4 py-4 sm:px-6 rounded-b-lg"
          >
            {Object.entries(currentTaskData).map(([key]) => (
              <GenericTaskSummation
                key={key}
                genericTask={currentTask.tasks[Number(key)].GenericTask}
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
            ))}
          </td>
        </tr>
      )}
    </>
  );
};

interface GenericTaskSummationProps {
  genericTask: TaskType["GenericTask"];
  usersSubmissions: UserSubmissions;
  submission: TaskData;
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: string;
  subtaskId: string;
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
  submissionState: "Rejected" | "WaitingForReview" | "Accepted";
  user: string;
}

interface SubtaskSubmission {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  taskId: bigint;
  subtaskId: bigint;
  reason: string | null;
}

const GenericTaskSummation = ({
  genericTask,
  submission,
  authAtlasSpace,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  spaceId,
  submissionState,
  user,
}: GenericTaskSummationProps) => {
  const dispatch = useDispatch();
  const userPrincipal = Principal.from(user);
  const isLoading = useSelector((state: RootState) => state.app.isLoading);

  const { register, handleSubmit } = useForm<SubtaskSubmission>();
  const onSubmit: SubmitHandler<SubtaskSubmission> = async (data) => {
    const rawReason = data.reason?.trim();
    const trimmedRawReason = !rawReason || rawReason === "" ? null : rawReason;
    await runWithLoading(
      async () => {
        await toast.promise(
          rejectSubtaskSubmission({
            authAtlasSpace,
            userPrincipal,
            taskId: BigInt(taskId),
            subtaskId: BigInt(subtaskId),
            reason: trimmedRawReason,
          }),
          {
            loading: "Rejecting task...",
            error: "Failed to reject task.",
          }
        );
        setShowRejectPopup(false);
        await getSpaceTasks({
          spaceId,
          unAuthAtlasSpace,
          dispatch,
        });
      },
      dispatch,
      () => setShowRejectPopup(false)
    );
  };

  const [showRejectPopup, setShowRejectPopup] = useState(false);

  const acceptSubtask = async () => {
    await runWithLoading(async () => {
      await toast.promise(
        acceptSubtaskSubmission({
          authAtlasSpace,
          userPrincipal,
          taskId: BigInt(taskId),
          subtaskId: BigInt(subtaskId),
        }),
        {
          loading: "Accepting task...",
          success: "Task accepted successfully.",
          error: "Failed to accept task.",
        }
      );
      await getSpaceTasks({
        spaceId,
        unAuthAtlasSpace,
        dispatch,
      });
    }, dispatch);
  };

  const singleSubmissionState = Object.keys(submission.submissionData.state)[0];

  return (
    <div className="text-left pb-4 mt-4 p-4 rounded-lg bg-[#1E0F33]/40">
      <p className="text-white text-xs font-semibold mb-2">
        Subtask: {subtaskId} | Status: {singleSubmissionState}
      </p>
      <h3 className="text-xl font-bold text-white mb-2 break-words">
        {genericTask.task_content.TitleAndDescription.task_title}
      </h3>
      <p className="text-wrap mb-4 break-words">
        {genericTask.task_content.TitleAndDescription.task_description}
      </p>
      <div className="mt-4">
        <p className="text-white font-semibold mb-1">Submitted response:</p>
        {"Text" in submission.submissionData.submission && (
          <div className="border-2 border-[#9173FF]/20 p-3 rounded-xl w-full mb-4 bg-[#9173FF]/20 text-white break-words">
            {submission.submissionData.submission.Text.content}
          </div>
        )}
        {submissionState === "Rejected" &&
          submission.submissionData.rejection_reason[0] &&
          submission.submissionData.rejection_reason[0].trim().length > 0 && (
            <div className="mt-2 p-3 rounded-lg border border-red-500 bg-red-900 bg-opacity-20 text-red-300">
              <p className="font-semibold text-red-200 mb-1">Reject Reason:</p>
              <p className="break-words">
                {submission.submissionData.rejection_reason[0]}
              </p>
            </div>
          )}
        <div className="flex flex-col justify-end gap-2">
          {singleSubmissionState === "WaitingForReview" && (
              <>
                <div className="flex gap-2 justify-end">
                  <Button onClick={acceptSubtask}>Accept</Button>
                  <Button
                    onClick={() => setShowRejectPopup(true)}
                    className="bg-red-500"
                  >
                    Reject
                  </Button>
                </div>
              </>
            )}
        </div>
      </div>
      {showRejectPopup && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isLoading ? "z-30 blur-sm" : "z-50"}`}
        >
          <div className="bg-[#402a5f] p-6 rounded-2xl shadow-lg w-96 text-black">
            <h2 className="text-xl text-white font-bold mb-4">
              Reason for Rejection
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="my-3 rounded-lg">
              <textarea
                {...register("reason")}
                className="w-full p-3 border border-[#8973FF]/20 bg-[#9173FF]/20 rounded-xl text-white mb-2 resize-none overflow-hidden"
                placeholder="Enter reason here(optional)"
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setShowRejectPopup(false);
                  }}
                  className=""
                >
                  Cancel
                </Button>
                <Button className="bg-red-500">Submit Rejection</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;
