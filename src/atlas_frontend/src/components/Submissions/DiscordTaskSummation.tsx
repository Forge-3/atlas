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

export type DiscordTaskDataType = {
  'guild_id' : string;
  'task_content' : TaskContent;
  'discord_invite_link' : string;
  'guild_icon' : [] | [string];
  'expires_at' : [] | [string];
  'submission' : Array<[Principal, SubmissionData]>;
};

interface DiscordTaskSummationProps {
  discordTask: DiscordTaskDataType;
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
  const userPrincipal = Principal.fromText(user);

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

  if ('TitleAndDescription' in discordTask.task_content) {
    taskTitle = discordTask.task_content.TitleAndDescription.task_title;
    taskDescription = discordTask.task_content.TitleAndDescription.task_description;
  } else if ('Discord' in discordTask.task_content) {
    taskTitle = discordTask.task_content.Discord.task_title;
    taskDescription = discordTask.task_content.Discord.task_description;
  }

  return (
    <div className="text-left pb-2 mt-2">
      {singleSubmissionState} {taskId} {subtaskId}
      <h3 className="text-xl font-bold text-wrap break-all">
        {taskTitle}
      </h3>
      <p className="text-wrap break-all">{taskDescription}</p>
      <p>Guild ID: {discordTask.guild_id}</p>
      {discordTask.discord_invite_link && (
        <p>Invite: <a href={discordTask.discord_invite_link} target="_blank" rel="noopener noreferrer">{discordTask.discord_invite_link}</a></p>
      )}
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

export default DiscordTaskSummation;