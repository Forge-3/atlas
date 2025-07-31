import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
  ClosedTask,
  EditTaskArgs,
  State,
  Submission,
  SubmissionData,
  Task,
  TaskContent,
  TaskType,
} from "../../../../declarations/atlas_space/atlas_space.did.js";
import { unwrapCall } from "../delegatedCall.js";
import { setSpace, setTasks } from "../../store/slices/spacesSlice.js";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { Principal } from "@dfinity/principal";
import type { ExternalLinks } from "./types.js";

interface CreateSubtaskArg {
  task_type: string;
  title: string;
  description: string;
  allow_resubmit: boolean;
}

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
  let state: State;
  let version: bigint;

  try {
    ({ state, version } = await unAuthAtlasSpace.get_space_info());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    [state, version] = await Promise.all([
      unAuthAtlasSpace.get_state(),
      unAuthAtlasSpace.get_current_bytecode_version(),
    ]);
  }
  const externalLinksObj = Object.fromEntries(state.external_links);

  dispatch(
    setSpace({
      spaceId,
      state: {
        ...state,
        version,
        space_symbol: state.space_symbol.pop() ?? null,
        space_background: state.space_background.pop() ?? null,
        space_logo: state.space_logo.pop() ?? null,
        external_links: {
          x: externalLinksObj?.x ?? null,
          telegram: externalLinksObj?.telegram ?? null,
          discord: externalLinksObj?.discord ?? null,
          linkedIn: externalLinksObj?.linkedIn ?? null,
        },
      },
    })
  );
};

interface CreateNewSpaceTaskArgs {
  authAtlasSpaceActor: ActorSubclass<_SERVICE>;
  numberOfUses: bigint;
  rewardPerUsage: bigint;
  tasks: CreateSubtaskArg[];
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
  const transformedTasks: TaskContent[] = tasks.map((arg) => ({
    TitleAndDescription: {
      task_title: arg.title,
      task_description: arg.description,
      allow_resubmit: arg.allow_resubmit,
    },
  }));

  const call = authAtlasSpaceActor.create_task({
    task_title: taskTitle,
    token_reward: {
      CkUsdc: {
        amount: rewardPerUsage,
      },
    },
    task_content: transformedTasks,
    number_of_uses: numberOfUses,
    start_time: startTime,
    end_time: endTime,
  });

  return unwrapCall<bigint>({
    call,
    errMsg: "Failed to create new task",
  });
};

export type AnyTask = Task | ClosedTask;
export type Tasks = { [key: string]: AnyTask };
export enum TaskTypeEnum {
  Open = "Open",
  Closed = "Closed",
}

const fetchTasks = async ({
  taskType,
  unAuthAtlasSpace,
  start: initialStart = 0n,
  count = 200n,
}: {
  taskType: TaskTypeEnum,
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  start?: bigint;
  count?: bigint;
}): Promise<Tasks> => {
  const result: [bigint, AnyTask][] = [];
  let totalCount = 0n;
  let start = initialStart;

  const unwrapMessage = (() => {
    switch (taskType) {
      case TaskTypeEnum.Open:
        return "Failed to fetch open tasks";
      case TaskTypeEnum.Closed:
        return "Failed to fetch closed tasks";
      default:
        return "Failed to fetch tasks";
    }
  })();

  const fetchFn = () => {
    switch (taskType) {
      case TaskTypeEnum.Open:
        return unAuthAtlasSpace.get_open_tasks({ start, count });
      case TaskTypeEnum.Closed:
        return unAuthAtlasSpace.get_closed_tasks({ start, count });
      default:
        throw new Error(`Unsupported TaskTypeEnum: ${taskType}`);
    }
  };

  const res = await unwrapCall<{ tasks_count: bigint; tasks: [bigint, AnyTask][] }>({
    call: fetchFn(),
    errMsg: unwrapMessage,
  });

  totalCount = res.tasks_count;
  result.push(...res.tasks);
  start += count;

  while (totalCount > result.length) {
    const res = await unwrapCall<{ tasks_count: bigint; tasks: [bigint, AnyTask][] }>({
      call: fetchFn(),
      errMsg: unwrapMessage,
    });
    result.push(...res.tasks);
    start += count;
  }

    return result.reduce((acc, [id, val]) => {
      acc[id.toString()] = val;
      return acc;
    }, {} as Tasks);
  };

export const getSpaceTasks = async ({
  unAuthAtlasSpace,
  spaceId,
  dispatch,
}: GetAtlasSpaceArgs) => {
  const [openTasks, closedTasks] = await Promise.all([
    fetchTasks({
      taskType: TaskTypeEnum.Open,
      unAuthAtlasSpace,
    }),
    fetchTasks({
      taskType: TaskTypeEnum.Closed,
      unAuthAtlasSpace,
    }),
  ]);

  const mergedTasks = {
    ...openTasks,
    ...closedTasks,
  } as { [key: string]: AnyTask };

  dispatch(
    setTasks({
        tasks: mergedTasks,
        spaceId,
      })
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

export interface RejectSubtaskSubmission {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  taskId: bigint;
  subtaskId: bigint;
  reason: string | null;
}

export interface AcceptSubtaskSubmission {
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
}: AcceptSubtaskSubmission) => {
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
  reason,
}: RejectSubtaskSubmission) => {
  const call = authAtlasSpace.reject_subtask_submission(
    userPrincipal,
    taskId,
    subtaskId,
    reason ? [reason] : []
  );

  await unwrapCall<null>({
    call,
    errMsg: "Failed to accept submission",
  });
};

export const getRejectionInfo = (
  submissionData: SubmissionData | null,
  submissionState: "Rejected" | "WaitingForReview" | "Accepted" | null
) => {
  if (!submissionData || submissionState !== "Rejected") {
    return { reasonText: null, showRejectionReason: false };
  }

  const rejectionReason = submissionData.rejection_reason.at(-1);

  const showRejectionReason =
    typeof rejectionReason === "string" && rejectionReason.length > 0;

  const reasonText = showRejectionReason ? rejectionReason : null;

  return { reasonText, showRejectionReason };
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

interface EditTaskCallArgs {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  args: EditTaskArgs;
}

export const editTask = async ({
  authAtlasSpace,
  args,
}: EditTaskCallArgs) => {
  const call = authAtlasSpace.edit_task(args);

  await unwrapCall<null>({
    call,
    errMsg: "Failed to edit task",
  });
};

interface CloseTaskArgs {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: bigint;
}

export const forceCloseTask = async ({
  authAtlasSpace,
  taskId,
}: CloseTaskArgs) => {
  const call = authAtlasSpace.force_close_task(taskId);

  await unwrapCall<null>({
    call,
    errMsg: "Failed to close task",
  });
};

export const deleteCloseTask = async ({
  authAtlasSpace,
  taskId,
}: CloseTaskArgs) => {
  const call = authAtlasSpace.delete_closed_task(taskId);

  await unwrapCall<null>({
    call,
    errMsg: "Failed to delete closed task",
  });
};


