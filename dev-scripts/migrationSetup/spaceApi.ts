import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE, Submission } from "../../src/declarations/atlas_space/atlas_space.did.js";
import { unwrapCall } from "../../src/atlas_frontend/src/canisters/delegatedCall.ts";
import type { Principal } from "@dfinity/principal";

export interface CreateSubtaskArg {
  title: string;
  description: string;
  allow_resubmit: boolean;
}

export interface CreateNewTaskArgs {
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
}: CreateNewTaskArgs) => {
  const transformedTasks = tasks.map((arg) => ({
    TitleAndDescription: {
      task_title: arg.title,
      task_description: arg.description,
      allow_resubmit: arg.allow_resubmit,
    },
  }));

  const call = authAtlasSpaceActor.create_task({
    task_title: taskTitle,
    token_reward: { CkUsdc: { amount: rewardPerUsage } },
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