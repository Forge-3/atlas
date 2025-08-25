import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../src/declarations/atlas_space/atlas_space.did.js";
import { acceptSubtaskSubmission, createNewTask, rejectSubtaskSubmission, submitSubtaskSubmission } from "./spaceApi.ts";
import type { CreateSubtaskArg } from "./spaceApi.ts";
import type { Principal } from "@dfinity/principal";

export const createSampleTasks = async (spaceActor: ActorSubclass<_SERVICE>) => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const SIX_MINUTES = 6n * 60n;
  const DAY = 24n * 60n * 60n;

  const task1Subtasks: CreateSubtaskArg[] = [
    { title: "Task1 - Subtask 1", description: "Description for Task1 Subtask 1", allow_resubmit: true },
    { title: "Task1 - Subtask 2", description: "Description for Task1 Subtask 2", allow_resubmit: true },
    { title: "Task1 - Subtask 3", description: "Description for Task1 Subtask 3", allow_resubmit: true },
  ];

  const task1Id = await createNewTask({
    authAtlasSpaceActor: spaceActor,
    numberOfUses: 1n,
    rewardPerUsage: 1_000_000_000n,
    tasks: task1Subtasks,
    taskTitle: "Task 1",
    startTime: now,
    endTime: now + SIX_MINUTES,
  });
  console.log("Created Task 1 with id:", task1Id.toString());

  const task2Subtasks: CreateSubtaskArg[] = [
    { title: "Task2 - Subtask 1", description: "Description for Task2 Subtask 1", allow_resubmit: true },
    { title: "Task2 - Subtask 2", description: "Description for Task2 Subtask 2", allow_resubmit: true },
  ];

  const task2Id = await createNewTask({
    authAtlasSpaceActor: spaceActor,
    numberOfUses: 3n,
    rewardPerUsage: 1_000_000_000n,
    tasks: task2Subtasks,
    taskTitle: "Task 2",
    startTime: now,
    endTime: now + SIX_MINUTES,
  });
  console.log("Created Task 2 with id:", task2Id.toString());

  const task3Subtasks: CreateSubtaskArg[] = [
    { title: "Task3 - Subtask 1", description: "Description for Task3 Subtask 1", allow_resubmit: true },
    { title: "Task3 - Subtask 2", description: "Description for Task3 Subtask 2", allow_resubmit: true },
    { title: "Task3 - Subtask 3", description: "Description for Task3 Subtask 3", allow_resubmit: true },
  ];

  const task3Id = await createNewTask({
    authAtlasSpaceActor: spaceActor,
    numberOfUses: 2n,
    rewardPerUsage: 1_000_000_000n,
    tasks: task3Subtasks,
    taskTitle: "Task 3",
    startTime: now,
    endTime: now + SIX_MINUTES,
  });
  console.log("Created Task 3 with id:", task3Id.toString());

  const task4Subtasks: CreateSubtaskArg[] = [
    { title: "Task4 - Subtask 1", description: "Description for Task4 Subtask 1", allow_resubmit: true },
    { title: "Task4 - Subtask 2", description: "Description for Task4 Subtask 2", allow_resubmit: false },
    { title: "Task4 - Subtask 3", description: "Description for Task4 Subtask 3", allow_resubmit: false },
  ];

  const task4Id = await createNewTask({
    authAtlasSpaceActor: spaceActor,
    numberOfUses: 3n,
    rewardPerUsage: 1_000_000_000n,
    tasks: task4Subtasks,
    taskTitle: "Task 4 (Starts in 3 days)",
    startTime: now + DAY * 3n,
    endTime: now + DAY * 5n,
  });
  console.log("Created Task 4 with id:", task4Id.toString());

  const task5Subtasks: CreateSubtaskArg[] = [
    { title: "Task5 - Subtask 1", description: "Description for Task5 Subtask 1", allow_resubmit: false },
    { title: "Task5 - Subtask 2", description: "Description for Task5 Subtask 2", allow_resubmit: false },
    { title: "Task5 - Subtask 3", description: "Description for Task5 Subtask 3", allow_resubmit: false },
  ];

  const task5Id = await createNewTask({
    authAtlasSpaceActor: spaceActor,
    numberOfUses: 3n,
    rewardPerUsage: 1_000_000_000n,
    tasks: task5Subtasks,
    taskTitle: "Task 5 (2 accepted)",
    startTime: now,
    endTime: now + DAY * 2n,
  });
  console.log("Created Task 5 with id:", task5Id.toString());

  const task6Subtasks: CreateSubtaskArg[] = [
    { title: "Task6 - Subtask 1", description: "Description for Task6 Subtask 1", allow_resubmit: false },
    { title: "Task6 - Subtask 2", description: "Description for Task6 Subtask 2", allow_resubmit: true },
    { title: "Task6 - Subtask 3", description: "Description for Task6 Subtask 3", allow_resubmit: true },
  ];

  const task6Id = await createNewTask({
    authAtlasSpaceActor: spaceActor,
    numberOfUses: 2n,
    rewardPerUsage: 1_000_000_000n,
    tasks: task6Subtasks,
    taskTitle: "Task 6 (1 rejected, no resubmit)",
    startTime: now,
    endTime: now + DAY * 2n,
  });
  console.log("Created Task 6 with id:", task6Id.toString());

  const task7Subtasks: CreateSubtaskArg[] = [
    { title: "Task7 - Subtask 1", description: "Description for Task7 Subtask 1", allow_resubmit: true },
  ];

  const task7Id = await createNewTask({
    authAtlasSpaceActor: spaceActor,
    numberOfUses: 3n,
    rewardPerUsage: 1_000_000_000n,
    tasks: task7Subtasks,
    taskTitle: "Task 7 (1 subtask, accepted)",
    startTime: now,
    endTime: now + DAY * 2n,
  });
  console.log("Created Task 7 with id:", task7Id.toString());

  return {
    taskIds: [ task1Id, task2Id, task3Id, task4Id, task5Id, task6Id, task7Id ],
    subtasksList: [ task1Subtasks, task2Subtasks, task3Subtasks, task4Subtasks, task5Subtasks, task6Subtasks, task7Subtasks ],
  };
};

export const submitSubtasks = async (
  userActor: ActorSubclass<_SERVICE>,
  taskIds: bigint[],
  subtasksList: CreateSubtaskArg[][],
) => {
  // Task 1: expired, submit all 3 subtasks
  for (let i = 0; i < subtasksList[0].length; i++) {
    await submitSubtaskSubmission({
      authAtlasSpace: userActor,
      taskId: taskIds[0],
      subtaskId: BigInt(i),
      submission: { Text: { content: `Submission for Task1 Subtask ${i + 1}` } },
    });
  }

  // Task 2: expired, submit all 2 subtasks
  for (let i = 0; i < subtasksList[1].length; i++) {
    await submitSubtaskSubmission({
      authAtlasSpace: userActor,
      taskId: taskIds[1],
      subtaskId: BigInt(i),
      submission: { Text: { content: `Submission for Task2 Subtask ${i + 1}` } },
    });
  }

  // Task 3: expired, submit only 2nd and 3rd subtasks
  for (let i = 1; i < subtasksList[2].length; i++) {
    await submitSubtaskSubmission({
      authAtlasSpace: userActor,
      taskId: taskIds[2],
      subtaskId: BigInt(i),
      submission: { Text: { content: `Submission for Task3 Subtask ${i + 1}` } },
    });
  }

  // Task 4 - future task, no submits

  // Task 5 - ongoing, submit only 2nd and 3rd subtasks
  for (let i = 1; i < subtasksList[4].length; i++) {
    await submitSubtaskSubmission({
      authAtlasSpace: userActor,
      taskId: taskIds[4],
      subtaskId: BigInt(i),
      submission: { Text: { content: `Submission for Task5 Subtask ${i + 1}` } },
    });
  }

  // Task 6 - ongoing, submit all
  for (let i = 0; i < subtasksList[5].length; i++) {
    await submitSubtaskSubmission({
      authAtlasSpace: userActor,
      taskId: taskIds[5],
      subtaskId: BigInt(i),
      submission: { Text: { content: `Submission for Task6 Subtask ${i + 1}` } },
    });
  }

  // Task 7 - ongoing, submit all (one)
  await submitSubtaskSubmission({
    authAtlasSpace: userActor,
    taskId: taskIds[6],
    subtaskId: 0n,
    submission: { Text: { content: "Submission for Task7 Subtask 1" } },
  });

  console.log("Submissions completed!");
};


interface ReviewSubtasksArgs {
  taskIds: bigint[];
  subtasksList: CreateSubtaskArg[][];
  spaceLeadActor: ActorSubclass<_SERVICE>;
  adminActor: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
}

export const reviewSubtasks = async ({
  taskIds,
  subtasksList,
  spaceLeadActor,
  adminActor,
  userPrincipal,
}: ReviewSubtasksArgs) => {
  console.log("Reviewing subtasks...");

  // Task 1: All subtasks accepted
  for (let i = 0; i < subtasksList[0].length; i++) {
    await acceptSubtaskSubmission({
      authAtlasSpace: spaceLeadActor,
      taskId: taskIds[0],
      subtaskId: BigInt(i),
      userPrincipal,
    });
  }

  // Task 2: no review

  // Task 3 - subtask2 accepted, subtask3 rejected (allow_resubmit=true)
  await acceptSubtaskSubmission({
    authAtlasSpace: spaceLeadActor,
    taskId: taskIds[2],
    subtaskId: 1n,
    userPrincipal,
  });
  await rejectSubtaskSubmission({
    authAtlasSpace: spaceLeadActor,
    taskId: taskIds[2],
    subtaskId: 2n,
    userPrincipal,
    reason: "Invalid submission",
  });

  // Task 4 - future task, no submits

  // Task 5 - 2,3 accepted, 1 no review
  await acceptSubtaskSubmission({
    authAtlasSpace: adminActor,
    taskId: taskIds[4],
    subtaskId: 1n,
    userPrincipal,
  });
  await acceptSubtaskSubmission({
    authAtlasSpace: adminActor,
    taskId: taskIds[4],
    subtaskId: 2n,
    userPrincipal,
  });

  // Task 6 - subtask1 rejected (allow_resubmit=false)
  await rejectSubtaskSubmission({
    authAtlasSpace: adminActor,
    taskId: taskIds[5],
    subtaskId: 0n,
    userPrincipal,
    reason: "Hard reject",
  });

  // Task 7 - subtask accepted
  await acceptSubtaskSubmission({
    authAtlasSpace: spaceLeadActor,
    taskId: taskIds[6],
    subtaskId: 0n,
    userPrincipal,
  });


  console.log("Review completed!");
};