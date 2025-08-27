import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  acceptSubtaskSubmission,
  getSpaceTasks,
  rejectSubtaskSubmission,
} from "../../canisters/atlasSpace/api";
import type {
  _SERVICE,
  TaskType,
} from "../../../../declarations/atlas_space/atlas_space.did";
import type { UserSubmissions } from "../../canisters/atlasSpace/tasks";
import Button from "../Shared/Button";
import type { TaskData } from "../../canisters/atlasSpace/types";
import toast from "react-hot-toast";
import type { RootState } from "../../store/store";
import { useForm, type SubmitHandler } from "react-hook-form";
import { runWithLoading } from "../../utils/loading";

type GenericTaskType = Extract<TaskType, { GenericTask: unknown }>['GenericTask'];
type DiscordTaskType = Extract<TaskType, { DiscordTask: unknown }>['DiscordTask'];

export interface TaskSummationProps {
  task: GenericTaskType | DiscordTaskType;
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

const getDiscordAccountCreationDate = (userId: string): Date => {
  const discordEpoch = 1420070400000;
  const timestamp = (BigInt(userId) >> 22n) + BigInt(discordEpoch);
  return new Date(Number(timestamp));
};

const TaskSummation = ({
  task,
  submission,
  authAtlasSpace,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  spaceId,
  submissionState,
  user,
}: TaskSummationProps) => {
  const dispatch = useDispatch();
  const userPrincipal = Principal.from(user);
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  const [showRejectPopup, setShowRejectPopup] = useState(false);

  const { register, handleSubmit } = useForm<SubtaskSubmission>();
  const onSubmit: SubmitHandler<SubtaskSubmission> = async (data) => {
    const rawReason = data.reason?.trim();
    const trimmedRawReason = !rawReason || rawReason === "" ? null : rawReason;

    await runWithLoading(async () => {
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
    }, dispatch,
    () => setShowRejectPopup(false)
    );
  };

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

  const renderTitleAndDescription = () => {
    if ('DiscordTask' in task.task_content) {
      return (
        <>
          <h3 className="text-xl font-bold text-wrap break-all">
            {task.task_content.DiscordTask.task_title}
          </h3>
          <p className="text-wrap break-all">
            {task.task_content.DiscordTask.task_description}
          </p>
        </>
      );
    }
    if ('TitleAndDescription' in task.task_content) {
      return (
        <>
          <h3 className="text-xl font-bold text-wrap break-all">
            {task.task_content.TitleAndDescription.task_title}
          </h3>
          <p className="text-wrap break-all">
            {task.task_content.TitleAndDescription.task_description}
          </p>
        </>
      );
    }
    return null;
  };

  const renderSubmissionContent = () => {
    if ('Discord' in submission.submissionData.submission) {
      const { username, user_id } = submission.submissionData.submission.Discord;
      const creationDate = getDiscordAccountCreationDate(user_id.toString());
      return (
        <div>
            <div>
              <p>Username: {username}</p>
              <p>Account Creation Date: {creationDate.toLocaleDateString()}</p>
            </div>
        </div>
      );
    }
    return <p>{submission.submissionData.submission.Text.content}</p>;
  };

  return (
    <div className="text-left pb-2 mt-2">
      {singleSubmissionState} {taskId} {subtaskId}
      {renderTitleAndDescription()}
      <div className="mt-4">
        <p className="text-white font-semibold mb-1">Submitted response:</p>
        <div className="border-2 border-[#9173FF]/20 p-2 rounded-xl w-full mb-4 bg-[#9173FF]/20 text-white">
          {renderSubmissionContent()}
        </div>
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
          {submissionState === "WaitingForReview" &&
            singleSubmissionState === "WaitingForReview" && (
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

export default TaskSummation;