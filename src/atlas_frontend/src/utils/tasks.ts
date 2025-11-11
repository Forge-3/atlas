import type { Principal } from "@dfinity/principal";
import type { SubmissionData, Task, TaskType, TokenReward } from "../../../declarations/atlas_space/atlas_space.did";
import type { AnyTask } from "../canisters/atlasSpace/api";
import { formatDuration } from "./date";

type Submission = [Principal, SubmissionData];

type SubmissionExtractor<K extends keyof TaskType> = (
  task: Extract<TaskType, Record<K, unknown>>
) => Submission[];

const submissionExtractors: {
  [K in keyof TaskType]?: SubmissionExtractor<K>;
} = {
  GenericTask: (t: Extract<TaskType, { GenericTask: unknown }>) => t.GenericTask.submission ?? [],
  DiscordTask: (t: Extract<TaskType, { DiscordTask: unknown }>) => t.DiscordTask.submission ?? [],
};

export class BlockchainTask implements Task {
    public tasks: TaskType[];
    public creator: Principal;
    public task_title: string;
    public token_reward: TokenReward;
    public rewarded: Principal[];
    public number_of_uses: bigint;
    public start_time: bigint;
    public end_time: bigint;
    public timer_id: [] | [bigint];

    constructor(public task: Task) {
        this.tasks = task.tasks;
        this.creator = task.creator;
        this.task_title = task.task_title;
        this.token_reward = task.token_reward;
        this.rewarded = task.rewarded;
        this.number_of_uses = task.number_of_uses;
        this.start_time = task.start_time;
        this.end_time = task.end_time;
        this.timer_id = task.timer_id;
    }

    getSubmissions(): Submission[] {
        const last = this.tasks.at(-1);
        if (!last) return [];

        for (const [key, extractor] of Object.entries(submissionExtractors)) {
            if (key in last) {
                return (extractor as (task: TaskType) => Submission[])(last);
            }
        }
    return [];
    }

    getAcceptedSubmissions(): number {
        return this.getSubmissions().filter(
            ([, submission]) => "Accepted" in submission.state
        ).length;
    }
}

export const getTaskType = (
  task: AnyTask,
  time: number
): "closed" | "expired" | "starting" | "ongoing" => {
  const isRefunded = "refunded" in task;
  const isExpired = "expired" in task;
  const isStarting = Number(task.start_time) > Number(time);
  if (isRefunded) return "closed";
  if (isExpired) return "expired";
  if (isStarting) return "starting";
  return "ongoing";
};

export const getStartingIn = (
  task: AnyTask,
  time: number,
  getTaskType: "closed" | "expired" | "starting" | "ongoing"
) => {
  return getTaskType === "starting"
    ? formatDuration(Number(task.start_time) - Number(time))
    : undefined;
};