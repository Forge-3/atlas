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
import { TiArrowSortedDown } from "react-icons/ti";
import Button from "../Shared/Button";
import SpaceHeader from "../Shared/SpaceHeader";
import type { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { TaskData, TasksData } from "../../canisters/atlasSpace/types";
import type { Space } from "../../store/slices/spacesSlice";
import { getSpacePath } from "../../router/paths";
import { useForm, type SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import { runWithLoading } from "../../utils/loading";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice";

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
    const parsedSpacePrincipal = useSpaceId({
          spacePrincipal,
          navigate,
        });
    if (!parsedSpacePrincipal) return <></>;

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

  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;

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
    <div className="mb-4">
      <div className="w-full min-h-screen">
        <SpaceHeader
          spaceName={spaceData.space_name}
          spaceDescription={spaceData.space_description}
          spaceLogo={spaceData.space_logo}
          spaceBackground={spaceData.space_background}
          externalLinks={spaceData.external_links}
          userInfo={userInfo}
          spacePrincipal={parsedSpacePrincipal}
        />
        <div className="w-full h-[1px] bg-primary mb-4" />

        <div className="flex flex-1 justify-between px-10">
          <Button
            variant="vivid"
            className="flex gap-2 md:flex-none px-4"
            onClick={() => navigate(getSpacePath(parsedSpacePrincipal))}
          >
            All Missions
          </Button>
          <Button
            variant="publish"
            onClick={() => navigate(-1)}
            className="px-2 font-semibold rounded text-sm sm:text-base"
          >
            Review
          </Button>
        </div>
        <div className="w-full h-[1px] bg-white/40 my-3" />
        <div className="relative w-full rounded-xl mb-1 p-4 sm:p-6">
          <h2 className="text-light text-h2 font-montserrat mt-4 pl-2">
            Mission Review
          </h2>
          <div className="hidden sm:block">
            <div className="mt-6 px-2">
              <div className="flex items-center text-xs sm:text-sm text-white gap-2 font-montserrat mb-2">
                <div className="w-64 shrink-0">
                  <div className="bg-primary rounded px-3 py-1 w-full text-center">
                    Date Created
                  </div>
                </div>
                <div className="flex-1 min-w-0 px-2">
                  <div className="bg-primary rounded px-3 py-1 w-full text-center">
                    Mission Name
                  </div>
                </div>
                <div className="w-36 shrink-0">
                  <div className="bg-primary rounded px-3 py-1 w-full text-center">
                    Status
                  </div>
                </div>
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
                <table className="table-fixed mt-6 w-full text-white text-center rtl:text-right border-separate border-spacing-x-2 font-montserrat">
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
  currentTaskData,
  authAtlasSpace,
  taskId,
  unAuthAtlasSpace,
  spaceId,
}: SummationProps) => {
  const [isSummationOpen, setSummationOpen] = useState(false);
  const submissionState = usersSubmissions.getSubmissionState(userPrincipal);

  const fakeDate = "2025/09/09, 15:44:37 PM UTC";
  const fakeRelative = "5 days ago";

  const badge = (state: "Rejected" | "WaitingForReview" | "Accepted") => {
    const base =
      "inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-semibold";
    switch (state) {
      case "Accepted":
        return `${base} bg-green-500/90 text-white`;
      case "Rejected":
        return `${base} bg-red-500/90 text-white`;
      default:
        return `${base} bg-indigo-500/90 text-white`;
    }
  };

  return (
    <div className="rounded-xl transition-colors duration-200
                odd:bg-primary/90 even:bg-dark/15
                sm:odd:bg-transparent sm:even:bg-transparent
                sm:hover:bg-primary/20">
      <div
        className="sm:hidden flex items-start gap-2 py-3 cursor-pointer"
        onClick={() => setSummationOpen((v) => !v)}
      >
        <div className="w-6 shrink-0 flex items-start justify-center pt-[2px]">
          <TiArrowSortedDown
            className={`text-lg text-white transition-transform duration-200 ${
              !isSummationOpen ? "-rotate-90" : ""
            }`}
          />
        </div>
        <div className="flex-1 min-w-0 text-white">
          <div className="mb-2">
            <div className="text-xs mb-1 font-semibold">Date Created</div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm truncate">{fakeDate}</span>
              <span className="text-xs flex-shrink-0">{fakeRelative}</span>
            </div>
          </div>
          <div className="mb-2">
            <div className="text-xs mb-1 font-semibold">Mission Name</div>
            <div className="text-sm truncate">{currentTask.task_title}</div>
          </div>
          <div>
            <div className="text-xs mb-1 font-semibold">Status</div>
            <span className={badge(submissionState)}>{submissionState}</span>
          </div>
        </div>
      </div>
      <div
        className="hidden sm:flex items-start gap-2  cursor-pointer"
        onClick={() => setSummationOpen((v) => !v)}
      >
        <div className="w-64 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <TiArrowSortedDown
              className={`text-xl text-white relative -top-[1px] transition-transform duration-200 ${
                !isSummationOpen ? "-rotate-90" : ""
              }`}
            />
            <span className="text-sm text-white truncate">{fakeDate}</span>
            <span className="text-xs text-white/70 flex-shrink-0">
              {fakeRelative}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <div className="rounded-lg px-3 text-sm truncate text-white">
            {currentTask.task_title}
          </div>
        </div>
        <div className="w-36 shrink-0 text-center">
          <span className={badge(submissionState)}>{submissionState}</span>
        </div>
      </div>
      {isSummationOpen && (
        <div className="px-2 pb-2">
          <div className="px-4 py-4 sm:px-6 rounded-b-lg">
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
                isFullyRewarded={currentTask.rewarded.length >= Number(currentTask.number_of_uses)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
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
  isFullyRewarded: boolean; 
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
  isFullyRewarded,
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
    <div className="text-left pb-4 p-4 rounded-lg odd:bg-white/10 even:bg-primary   sm:bg-darker/40">
      <p className="text-white text-xs font-semibold mb-2">
        Subtask: {subtaskId} | Status: {singleSubmissionState}
      </p>
      <h3 className="sm:text-xl font-bold text-white mb-2 break-words">
        {genericTask.task_content.TitleAndDescription.task_title}
      </h3>
      <p className="text-sm sm:text-base text-wrap text-white mb-4 break-words">
        {genericTask.task_content.TitleAndDescription.task_description}
      </p>
      <div className="mt-4 text-sm sm:text-base">
        <p className="text-white font-semibold mb-1">Submitted response:</p>
        {"Text" in submission.submissionData.submission && (
          <div className="border-2 border-dark/10 p-3 rounded w-full mb-4 bg-primary/20 text-white break-words">
            {submission.submissionData.submission.Text.content}
          </div>
        )}
        {"List" in submission.submissionData.submission && (
          <ul className="list-disc list-inside border-2 border-[#9173FF]/20 p-3 rounded-xl w-full mb-4 bg-[#9173FF]/20 text-white space-y-1">
            {submission.submissionData.submission.List.items.map((item: string, idx: number) => (
              <li key={idx} className="break-words whitespace-pre-wrap">
                {item}
              </li>
            ))}
          </ul>
        )}
        
        {submissionState === "Rejected" &&
          submission.submissionData.rejection_reason[0] &&
          submission.submissionData.rejection_reason[0].trim().length > 0 && (
            <div className="mt-2 p-3 text-sm sm:text-base rounded border border-red-500 bg-red-800 text-red-300">
              <p className="font-semibold text-white mb-1">Reject Reason:</p>
              <p className="break-words">
                {submission.submissionData.rejection_reason[0]}
              </p>
            </div>
          )}
        <div className="flex flex-col justify-end gap-2">
          {singleSubmissionState === "WaitingForReview" && !isFullyRewarded && (
              <>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={acceptSubtask}
                    className="px-4 font-medium"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => setShowRejectPopup(true)}
                    className="bg-red-500"
                  >
                    Reject
                  </Button>
                </div>
              </>
            )}
            {singleSubmissionState === "WaitingForReview" && isFullyRewarded && (
            <div className="flex justify-end">
              <p className="text-yellow-400 font-semibold">All rewards granted</p>
            </div>
          )}
        </div>
      </div>
      {showRejectPopup && (
        <div
          className={`fixed inset-0 bg-black/30 flex items-center justify-center ${isLoading ? "z-30 blur-sm" : "z-50"}`}
        >
          <div className="bg-dark m-4 p-6 rounded-2xl shadow-lg w-96 text-black">
            <h2 className="text-xl text-white font-bold mb-4">
              Reason for Rejection
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="my-3 rounded-lg">
              <textarea
                {...register("reason")}
                className="w-full p-3 border outline-none focus:outline-none border-light/20 rounded-xl text-white mb-2 resize-none overflow-hidden"
                placeholder="Enter reason here(optional)"
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowRejectPopup(false);
                  }}
                  className="px-2"
                >
                  Cancel
                </Button>
                <Button 
                variant="red"
                className="px-2">Submit Rejection</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;


