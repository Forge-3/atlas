import React from 'react';
import { taskRegistry } from './tasks/taskRegistry';
import type { TaskType } from "../../../../declarations/atlas_space/atlas_space.did";
import type { Principal } from '@dfinity/principal';
import type { ActorSubclass } from '@dfinity/agent';
import type { _SERVICE } from '../../../../declarations/atlas_space/atlas_space.did';

interface TaskRendererProps {
  task: [number, TaskType];
  spacePrincipal: Principal;
  taskId: string;
  unAuthAtlasSpace: ActorSubclass<_SERVICE> | null;
  isUserInHub: boolean;
}

type GenericTaskType = Extract<TaskType, { GenericTask: unknown }>["GenericTask"];
type DiscordTaskType = Extract<TaskType, { DiscordTask: unknown }>["DiscordTask"];

const TaskRenderer: React.FC<TaskRendererProps> = ({ task, ...props }) => {
  const [subtaskId, taskData] = task;

  if ("GenericTask" in taskData) {
    const GenericTaskComponent = taskRegistry.GenericTask;
    return (
      <GenericTaskComponent
        {...props}
        subtaskId={subtaskId}
        genericTask={taskData.GenericTask as GenericTaskType}
      />
    );
  }

  if ("DiscordTask" in taskData) {
    const DiscordTaskComponent = taskRegistry.DiscordTask;
    return (
      <DiscordTaskComponent
        {...props}
        subtaskId={subtaskId}
        discordTask={taskData.DiscordTask as DiscordTaskType}
      />
    );
  }

  return null;
};

export default TaskRenderer;