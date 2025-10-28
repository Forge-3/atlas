import type { AnyTask } from "../canisters/atlasSpace/api";
import { formatDuration } from "./date";

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
