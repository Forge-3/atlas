import type { Principal } from "@dfinity/principal";
import type { SubmissionData, Task, TaskType, TokenReward } from "../../../declarations/atlas_space/atlas_space.did";

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
    
    constructor(public task: Task) {
        this.tasks = task.tasks;
        this.creator = task.creator;
        this.task_title = task.task_title;
        this.token_reward = task.token_reward;
        this.rewarded = task.rewarded;
        this.number_of_uses = task.number_of_uses;
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
