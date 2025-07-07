import React from "react";
import { useDispatch } from "react-redux";
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

type DiscordTaskType = Extract<TaskType, { DiscordTask: unknown }>['DiscordTask'];

export interface DiscordTaskSummationProps {
  discordTask: DiscordTaskType;
  usersSubmissions: UserSubmissions;
  submission: TaskData;
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: string;
  subtaskId: string;
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
  submissionState: "Rejected" | "WaitingForReview" | "Accepted"
  user: string
}

const DiscordTaskSummation = ({
  discordTask,
  submission,
  authAtlasSpace,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  spaceId,
  submissionState,
  user
}: DiscordTaskSummationProps) => {
  const dispatch = useDispatch();
  const userPrincipal = Principal.from(user)

  const acceptSubtask = async () => {
    await acceptSubtaskSubmission({
      authAtlasSpace,
      userPrincipal,
      taskId: BigInt(taskId),
      subtaskId: BigInt(subtaskId),
    });
    await getSpaceTasks({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  };

  const rejectSubtask = async () => {
    await rejectSubtaskSubmission({
      authAtlasSpace,
      userPrincipal,
      taskId: BigInt(taskId),
      subtaskId: BigInt(subtaskId),
    });
    await getSpaceTasks({
      spaceId,
      unAuthAtlasSpace,
      dispatch,
    });
  };
  const singleSubmissionState = Object.keys(submission.submissionData.state)[0]

  return (
    <div className="text-left pb-2 mt-2">
      {singleSubmissionState} {taskId} {subtaskId}
      { 'DiscordTask' in discordTask.task_content && (
        <>
      <h3 className="text-xl font-bold text-wrap break-all">
        {discordTask.task_content.DiscordTask.task_title}
      </h3>
      <p className="text-wrap break-all">
        {discordTask.task_content.DiscordTask.task_description}
      </p>
      </>
      )}
      <div className="mt-4">
        <p className="text-white font-semibold mb-1">Submitted response:</p>
        <div className="border-2 border-[#9173FF]/20 p-2 rounded-xl w-full mb-4 bg-[#9173FF]/20 text-white">
          {submission.submissionData.submission.Text.content}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {submissionState == "WaitingForReview" && singleSubmissionState == "WaitingForReview" && (
          <>
            <Button onClick={acceptSubtask}>Accept</Button>
            <Button onClick={rejectSubtask} className="bg-red-500">
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DiscordTaskSummation;
