export enum TaskType {
  Generic = "generic",
  Discord = "discord",
}

type TaskInput = {
  taskType: TaskType;
  title: string;
  description: string;
  guildId?: string;
  inviteLink?: string;
  allowresubmit: boolean;
};

interface BaseTaskContent  {
    title: string,
    description: string,
    allow_resubmit: boolean,
}

export interface GenericTaskContent extends BaseTaskContent  {
  task_type: "generic";
};

export interface DiscordTaskContent extends BaseTaskContent {
  task_type: "discord";
  invite_link: string;
  guild_id: string;
};

type TaskContent = GenericTaskContent | DiscordTaskContent;

type MapperFn = (task: TaskInput) => TaskContent;

const taskMappers: Record<TaskType, MapperFn> = {
  [TaskType.Generic]: (task) => ({
    task_type: "generic",
    title: task.title,
    description: task.description,
    allow_resubmit: task.allowresubmit,
  }),

  [TaskType.Discord]: (task) => ({
    task_type: "discord",
    title: task.title,
    description: task.description,
    invite_link: task.inviteLink!,
    guild_id: task.guildId!,
    allow_resubmit: task.allowresubmit,
  }),
};

export const mapTasks = (tasks: TaskInput[]): TaskContent[] => {
  return tasks.map((task) => taskMappers[task.taskType](task));
};
