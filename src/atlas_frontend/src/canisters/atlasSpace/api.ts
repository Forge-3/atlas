import type { ActorSubclass } from "@dfinity/agent";
import type {
  _SERVICE,
  DiscordGuild,
  GetTasksRes,
  State,
  Submission,
  Task,
  TaskContent,
} from "../../../../declarations/atlas_space/atlas_space.did.js";
import { unwrapCall } from "../delegatedCall.js";
import { setSpace, setTasks } from "../../store/slices/spacesSlice.js";
import type { Dispatch } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { Principal } from "@dfinity/principal";
import type { ExternalLinks } from "./types.js";
import { string } from "yup";

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
  tasks: TaskContent[];
  taskTitle: string;
}

export const createNewTask = async ({
  authAtlasSpaceActor,
  numberOfUses,
  rewardPerUsage,
  tasks,
  taskTitle,
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
  });

  return unwrapCall<bigint>({
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
  let tasksCount = 0n;
  let start = 0n;
  const count = 200n;
  const call = unAuthAtlasSpace.get_open_tasks({
    start,
    count,
  });
  const res = await unwrapCall<GetTasksRes>({
    call,
    errMsg: "Failed to get data from blockchain",
  });

  const tasks = Object.fromEntries(res.tasks);
  dispatch(
    setTasks({
      tasks,
      spaceId,
    })
  );
  tasksCount = res.tasks_count;
  start += count;

  while (tasksCount < tasks.length) {
    const call = unAuthAtlasSpace.get_open_tasks({
      start,
      count,
    });
    const res = await unwrapCall<GetTasksRes>({
      call,
      errMsg: "Failed to get data from blockchain",
    });

    const tasks = Object.fromEntries(res.tasks);
    dispatch(
      setTasks({
        tasks,
        spaceId,
      })
    );
    start += count;
  }
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


export const getDiscordGuilds = async (
  actor: ActorSubclass<_SERVICE>,
  accessToken: string,
)=> {
  const call = actor.get_user_guilds(accessToken);

  return await unwrapCall<DiscordGuild[]>({
    call,
    errMsg: "Failed to get Discord guilds from canister",
  });
};