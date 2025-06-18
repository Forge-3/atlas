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
  TaskContent,
  SubmissionData,
} from "../../../../declarations/atlas_space/atlas_space.did";
import type { UserSubmissions } from "../../canisters/atlasSpace/tasks";
import type { ActualSubmissionDataType } from './index';

import Button from "../Shared/Button";

export type GenericTaskDataType = {
  'task_content' : TaskContent;
  'submission' : Array<[Principal, SubmissionData]>;
};

interface GenericTaskSummationProps {
  genericTask: GenericTaskDataType;
  usersSubmissions: UserSubmissions;
  submission: ActualSubmissionDataType;
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: string;
  subtaskId: string;
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
  submissionState: "Rejected" | "WaitingForReview" | "Accepted"
  user: string
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
  user
}: GenericTaskSummationProps) => {
  const dispatch = useDispatch();
  const userPrincipal = Principal.fromText(user)

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
  const singleSubmissionState = submission.submissionData.state ? Object.keys(submission.submissionData.state)[0] : "Unknown";


  let taskTitle: string = "N/A";
  let taskDescription: string = "N/A";

  if ('TitleAndDescription' in genericTask.task_content) {
    taskTitle = genericTask.task_content.TitleAndDescription.task_title;
    taskDescription = genericTask.task_content.TitleAndDescription.task_description;
  } else if ('Discord' in genericTask.task_content) {
    taskTitle = genericTask.task_content.Discord.task_title;
    taskDescription = genericTask.task_content.Discord.task_description;
  }

  return (
    <div className="text-left pb-2 mt-2">
      {singleSubmissionState} {taskId} {subtaskId}
      <h3 className="text-xl font-bold text-wrap break-all">
        {taskTitle}
      </h3>
      <p className="text-wrap break-all">{taskDescription}</p>
      <div className="mt-4">
        <p className="text-white font-semibold mb-1">Submitted response:</p>
        <div className="border-2 border-[#9173FF]/20 p-2 rounded-xl w-full mb-4 bg-[#9173FF]/20 text-white">
          {submission.submissionData.submission && 'Text' in submission.submissionData.submission ? (
            submission.submissionData.submission.Text.content
          ) : (
            "No text content or unknown submission type"
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {submissionState === "WaitingForReview" && singleSubmissionState === "WaitingForReview" && (
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

export default GenericTaskSummation;