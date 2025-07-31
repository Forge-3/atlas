import { DECIMALS } from "../canisters/ckUsdcLedger/constans";
import type { EditableTask } from "../modals/CreateNewTaskModal";
import { toLocalISOString } from "./date";
import { formatUnits } from "ethers";

export function mapTaskToForm(taskToEdit: EditableTask) {
  return {
    numberOfUses: Number(taskToEdit.number_of_uses),
    rewardPerUsage: Number(
      formatUnits(taskToEdit.token_reward.CkUsdc.amount, DECIMALS)
    ),
    taskTitle: taskToEdit.task_title,
    startTime: toLocalISOString(Number(taskToEdit.start_time)),
    endTime: toLocalISOString(Number(taskToEdit.end_time)),
    tasks: taskToEdit.tasks.map((t: any) => {
      if ("GenericTask" in t) {
        const content = t.GenericTask.task_content.TitleAndDescription;
        return {
          taskType: "generic" as const,
          title: content.task_title,
          description: content.task_description,
          allowresubmit: content.allow_resubmit,
        };
      }
      throw new Error("Unsupported task type in edit mode");
    }),
  };
}
