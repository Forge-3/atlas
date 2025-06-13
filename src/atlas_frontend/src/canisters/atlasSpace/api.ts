import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
  GetTasksRes,
  Submission,
  Task,
  CreateTaskArgs,
  DiscordInviteApiResponse,
} from "../../../../declarations/atlas_space/atlas_space.did.js";
import { unwrapCall } from "../delegatedCall.js";
import { setSpace, setTasks } from "../../store/slices/spacesSlice.js";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { storableState } from "./storable.js";
import { serify } from "@karmaniverous/serify-deserify";
import { customSerify } from "../../store/store.js";

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
  subtasks: CreateTaskArgs['subtasks'];
  taskTitle: string;
}

export const createNewTask = async ({
  authAtlasSpaceActor,
  numberOfUses,
  rewardPerUsage,
  subtasks,
  taskTitle,
}: CreateNewSpaceTaskArgs) => {
  const call = authAtlasSpaceActor.create_task({
    task_title: taskTitle,
    token_reward: {
      CkUsdc: {
        amount: rewardPerUsage,
      },
    },
    subtasks,
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

  const processedTasksForRedux: { [key: string]: Task } = {};

  tasks.forEach(([id, task]) => {
    const serializableTask = { ...task };

    if (serializableTask.subaccount instanceof Uint8Array) {
      serializableTask.subaccount = Array.from(serializableTask.subaccount);
    }
    processedTasksForRedux[id.toString()] = serializableTask;
  });

  dispatch(
    setTasks(
      serify(
        {
          tasks: processedTasksForRedux,
          spaceId,
        },
        customSerify
      ) as { tasks: { [key: string]: Task; }; spaceId: string; }
    )
  );
};

interface SubmitSubtaskSubmissionArgs {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: bigint,
  subtaskId: bigint,
  submission: Submission
}

export const submitSubtaskSubmission = async ({
  authAtlasSpace,
  taskId,
  subtaskId,
  submission
}: SubmitSubtaskSubmissionArgs) => {
  return await authAtlasSpace.submit_subtask_submission(
    taskId,
    subtaskId,
    submission
  );
}

export const getDiscordGuildsFromCanister = async (
    actor: ActorSubclass<_SERVICE>,
    accessToken: string
): Promise<{ Ok: DiscordGuildResponse[] } | { Err: string }> => {
    const result = await actor.get_discord_guilds(accessToken);
    if ('Ok' in result) {
        const mappedGuilds = result.Ok.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon.length > 0 ? guild.icon[0] : null
        }));
        return { Ok: mappedGuilds };
    } else {
        return { Err: result.Err };
    }
};

export const validateDiscordInviteLinkQuery = async (
  actor: ActorSubclass<_SERVICE>,
  inviteLink: string,
  guildId: string
): Promise<DiscordInviteApiResponse> => {
  const result = await actor.validate_discord_invite_link(inviteLink, guildId);
  
  if ("Err" in result) {
    throw new Error(result.Err);
  }
  return result.Ok
};