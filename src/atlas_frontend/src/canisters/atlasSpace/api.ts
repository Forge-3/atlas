import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
  ClosedTask,
  GetClosedTasksRes,
  GetTasksRes,
  Submission,
  Task,
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
import type { ExternalLinks } from "./types.js";
import { keyframes } from "framer-motion";

interface GetAtlasSpaceArgs {
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
  dispatch: Dispatch<UnknownAction>;
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
  tasks: TaskContent[];
  taskTitle: string;
  startTime: bigint;
  endTime: bigint;
}

export const createNewTask = async ({
  authAtlasSpaceActor,
  numberOfUses,
  rewardPerUsage,
  tasks,
  taskTitle,
  startTime,
  endTime,
}: CreateNewSpaceTaskArgs) => {
  const call = authAtlasSpaceActor.create_task({
    task_title: taskTitle,
    token_reward: {
      CkUsdc: {
        amount: rewardPerUsage,
      },
    },
    task_content: tasks,
    number_of_uses: numberOfUses,
    start_time: startTime,
    end_time: endTime,
  });

  return await unwrapCall<bigint>({
    call,
    errMsg: "Failed to create new task",
  });
};

export type AnyTask = Task | ClosedTask;
export type Tasks = { [key: string]: AnyTask };

const fetchTasks = async <T>({
  fetchFn,
  unwrapMessage,
  start: initialStart = 0n,
  count = 200n,
}: {
  fetchFn: (start: bigint, count: bigint) => Promise<
    { Ok: { tasks_count: bigint; tasks: [bigint, T][] } } | { Err: unknown }
  >;
  unwrapMessage: string;
  start?: bigint;
  count?: bigint;
}): Promise<{ [key: string]: T }> => {
  const result: [bigint, T][] = [];
  let totalCount = 0n;
  let start = initialStart;

  const call = fetchFn(start, count);
  const res = await unwrapCall<{ tasks_count: bigint; tasks: [bigint, T][] }>({
    call,
    errMsg: unwrapMessage,
  });

  totalCount = res.tasks_count;
  result.push(...res.tasks);
  start += count;

  while (totalCount > result.length) {
    const call = fetchFn(start, count);
    const res = await unwrapCall<{ tasks_count: bigint; tasks: [bigint, T][] }>({
      call,
      errMsg: unwrapMessage,
    });
    result.push(...res.tasks);
    start += count;
  }

  return result.reduce(
    (acc, [id, val]) => ({
      ...acc,
      [id.toString()]: val,
    }),
    {} as { [key: string]: T }
  );
};

export const getSpaceTasks = async ({
  unAuthAtlasSpace,
  spaceId,
  dispatch,
}: GetAtlasSpaceArgs) => {
  const [openTasks, closedTasks] = await Promise.all([
    fetchTasks<Task>({
      fetchFn: (start, count) =>
        unAuthAtlasSpace.get_open_tasks({ start, count }),
      unwrapMessage: "Failed to fetch open tasks",
    }),
    fetchTasks<ClosedTask>({
      fetchFn: (start, count) =>
        unAuthAtlasSpace.get_closed_tasks({ start, count }),
      unwrapMessage: "Failed to fetch closed tasks",
    }),
  ]);

  const mergedTasks = {
    ...openTasks,
    ...closedTasks,
  } as { [key: string]: AnyTask };

  dispatch(
    setTasks(
      serify(
        {
          tasks: mergedTasks,
          spaceId,
        },
        customSerify
      ) as { tasks: { [key: string]: AnyTask }; spaceId: string }
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

interface EditSpaceArgs {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  name: string;
  description: string;
  logo: string | null;
  background: string | null;
  externalLinks: ExternalLinks;
}

export const editSpace = async ({
  authAtlasSpace,
  name,
  description,
  logo,
  background,
  externalLinks,
}: EditSpaceArgs) => {
  const call = authAtlasSpace.edit_space({
    external_links: Object.entries(externalLinks).filter(([, val]) => !!val),
    space_background: background ? [background] : [],
    space_logo: logo ? [logo] : [],
    space_name: name,
    space_description: description,
  });

  await unwrapCall<null>({
    call,
    errMsg: "Failed to edit space",
  });
};
