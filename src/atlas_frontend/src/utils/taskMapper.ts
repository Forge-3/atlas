import type { AnswerFormat } from "../../../declarations/atlas_space/atlas_space.did";

export enum TaskType {
  Generic = "generic",
  Discord = "discord",
  Twitter = "twitter",
}

type TaskInput = {
  taskType: TaskType;
  title: string;
  description: string;
  guildId?: string;
  inviteLink?: string;
  allowResubmit: boolean;
  answerFormat?: AnswerFormat;
};

interface BaseTaskContent  {
    title: string,
    description: string,
    allow_resubmit: boolean,
}

export interface GenericTaskContent extends BaseTaskContent  {
  task_type: "generic";
  answer_format: AnswerFormat;
};

export interface DiscordTaskContent extends BaseTaskContent {
  task_type: "discord";
  invite_link: string;
  guild_id: string;
};

export interface TwitterTaskContent extends BaseTaskContent {
  task_type: "twitter";
};

type TaskContent = GenericTaskContent | DiscordTaskContent | TwitterTaskContent;

type MapperFn = (task: TaskInput) => TaskContent;

const taskMappers: Record<TaskType, MapperFn> = {
  [TaskType.Generic]: (task) => ({
    task_type: "generic",
    title: task.title,
    description: task.description,
    allow_resubmit: task.allowResubmit,
    answer_format: task.answerFormat!,
  }),

  [TaskType.Discord]: (task) => ({
    task_type: "discord",
    title: task.title,
    description: task.description,
    invite_link: task.inviteLink!,
    guild_id: task.guildId!,
    allow_resubmit: task.allowResubmit,
  }),

  [TaskType.Twitter]: (task) => ({
    task_type: "twitter",
    title: task.title,
    description: task.description,
    allow_resubmit: task.allowResubmit,
  }),
};

export const mapTasks = (tasks: TaskInput[]): TaskContent[] => {
  return tasks.map((task) => taskMappers[task.taskType](task));
};