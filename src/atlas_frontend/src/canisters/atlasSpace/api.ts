import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
  GetTasksRes,
  Submission,
  Task,
  DiscordInviteApiResponse,
  DiscordGuild,
  CreateTaskType,
  TaskContent,
} from "../../../../declarations/atlas_space/atlas_space.did.js";
import { unwrapCall } from "../delegatedCall.js";
import { setSpace, setTasks } from "../../store/slices/spacesSlice.js";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { storableState } from "./storable.js";
import { serify } from "@karmaniverous/serify-deserify";
import { customSerify } from "../../store/store.js";
import type { Principal } from "@dfinity/principal";

interface GetAtlasSpaceArgs {
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
  dispatch: Dispatch<UnknownAction>;
}

export interface DiscordGuildResponse {
    id: string;
    name: string;
    icon?: string | null;
}

export const getAtlasSpace = async ({
  unAuthAtlasSpace,
  spaceId,
  dispatch,
}: GetAtlasSpaceArgs) => {
  const state = await unAuthAtlasSpace.get_state();

  dispatch(
    setSpace({
      state: storableState(state),
      spaceId,
    })
  );
};

interface CreateNewSpaceTaskArgs {
  authAtlasSpaceActor: ActorSubclass<_SERVICE>;
  numberOfUses: bigint;
  rewardPerUsage: bigint;
  task_content: Array<[CreateTaskType, TaskContent]>;
  taskTitle: string;
}

export const createNewTask = async ({
  authAtlasSpaceActor,
  numberOfUses,
  rewardPerUsage,
  task_content,
  taskTitle,
}: CreateNewSpaceTaskArgs) => {
  const call = authAtlasSpaceActor.create_task({
    task_title: taskTitle,
    token_reward: {
      CkUsdc: {
        amount: rewardPerUsage,
      },
    },
    task_content,
    number_of_uses: numberOfUses,
  });

  return await unwrapCall<bigint>({
    call,
    errMsg: "Failed to create new task",
  });
};

export type Tasks = { [key: string]: Task };

export const getSpaceTasks = async ({
  unAuthAtlasSpace,
  spaceId,
  dispatch,
}: GetAtlasSpaceArgs) => {
  const tasks: [bigint, Task][] = [];
  let tasksCount = 0n;
  let start = 0n;
  const count = 200n;

  const initialCall = unAuthAtlasSpace.get_open_tasks({
    start,
    count,
  });
  const initialRes = await unwrapCall<GetTasksRes>({
    call: initialCall,
    errMsg: "Failed to get data from blockchain",
  });

  tasksCount = initialRes.tasks_count;
  tasks.push(...initialRes.tasks);
  start += count;

  while (tasks.length < tasksCount) {
    const call = unAuthAtlasSpace.get_open_tasks({
      start,
      count,
    });
    const res = await unwrapCall<GetTasksRes>({
      call,
      errMsg: "Failed to get data from blockchain",
    });
    tasks.push(...res.tasks);
    start += count;
  }

  const storableTasks = tasks.reduce(
    (acc, [id, val]) => ({
      ...acc,
      [id.toString()]: val,
    }),
    {}
  );

  dispatch(
    setTasks(
      serify(
        {
          tasks: storableTasks,
          spaceId,
        },
        customSerify
      ) as { tasks: { [key: string]: Task }; spaceId: string }
    )
  );
};

interface SubmitSubtaskSubmissionArgs {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: bigint;
  subtaskId: bigint;
  submission: Submission;
}

export const submitSubtaskSubmission = async ({
  authAtlasSpace,
  taskId,
  subtaskId,
  submission,
}: SubmitSubtaskSubmissionArgs) => {
  const call = authAtlasSpace.submit_subtask_submission(
    taskId,
    subtaskId,
    submission
  );
  
  await unwrapCall<null>({
    call,
    errMsg: "Failed to send subtask submission",
  });
};

interface SubtaskSubmission {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  taskId: bigint;
  subtaskId: bigint;
}

export const acceptSubtaskSubmission = async ({
  authAtlasSpace,
  userPrincipal,
  taskId,
  subtaskId,
}: SubtaskSubmission) => {
  const call = authAtlasSpace.accept_subtask_submission(
    userPrincipal,
    taskId,
    subtaskId
  );

  await unwrapCall<null>({
    call,
    errMsg: "Failed to accept submission",
  });
};

export const rejectSubtaskSubmission = async ({
  authAtlasSpace,
  userPrincipal,
  taskId,
  subtaskId,
}: SubtaskSubmission) => {
  const call = authAtlasSpace.reject_subtask_submission(
    userPrincipal,
    taskId,
    subtaskId
  );

  await unwrapCall<null>({
    call,
    errMsg: "Failed to accept submission",
  });
};

interface WithdrawReward {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: bigint;
}

export const withdrawReward = async ({
  authAtlasSpace,
  taskId,
}: WithdrawReward) => {
  const call = authAtlasSpace.withdraw_reward(taskId);

  await unwrapCall<null>({
    call,
    errMsg: "Failed to withdraw rewards",
  });
};

export const getDiscordGuildsFromCanister = async (
    actor: ActorSubclass<_SERVICE>,
    accessToken: string
    )=> {
    const call = actor.get_discord_guilds(accessToken);
    return await unwrapCall<Array<DiscordGuild>>({
    call,
    errMsg: "Failed to get Discord guilds",
  });
};

export const validateDiscordInviteLinkQuery = async (
  actor: ActorSubclass<_SERVICE>,
  inviteLink: string,
  guildId: string
  )=> {
  const call = actor.validate_discord_invite_link(inviteLink, guildId);
  return await unwrapCall<DiscordInviteApiResponse>({
    call,
    errMsg: "Failed to validate Discord invite link",
  });
}

