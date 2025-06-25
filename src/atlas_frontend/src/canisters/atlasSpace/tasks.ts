import type {
  SubmissionState,
  TaskType,
} from "../../../../declarations/atlas_space/atlas_space.did";
import type { UserSubmissionsData } from "./types";

export const getUsersSubmissions = (tasks: TaskType[]) => {
  const data = tasks.reduce((acc, task, index) => {
    if ("GenericTask" in task) {
      const genericTask = task.GenericTask;
      genericTask.submission.forEach(([principal, submissionData]) => {
        const principalText = principal.toText();
        if (!acc[principalText]) {
          acc[principalText] = {};
        }
        if (!acc[principalText][`${index}`]) {
          acc[principalText][`${index}`] = {
            submissionData,
            taskType: "GenericTask",
          };
        }
      });
      return acc;
    }
    return acc;
  }, {} as UserSubmissionsData);

  return new UserSubmissions(data);
};

export class UserSubmissions {
  constructor(public userSubmissionsData: UserSubmissionsData) {}

  getSubmission(principal: string, taskId: string) {
    return this.userSubmissionsData?.[principal]?.[taskId];
  }

  isAccepted(principal: string) {
    const tasksData = this.userSubmissionsData[principal]
    if (!tasksData) return false
    return Object.values(tasksData).every(
      (task) =>
        (Object.keys(task.submissionData.state)[0] as keyof SubmissionState) ===
        "Accepted"
    );
  }

  isRejected(principal: string) {
    const tasksData = this.userSubmissionsData[principal]
    if (!tasksData) return false
    return Object.values(tasksData).some(
      (task) =>
        (Object.keys(task.submissionData.state)[0] as keyof SubmissionState) ===
        "Rejected"
    );
  }

  isWaitingForReview(principal: string) {
    const tasksData = this.userSubmissionsData[principal]
    if (!tasksData) return false
    return Object.values(tasksData).some(
      (task) =>
        (Object.keys(task.submissionData.state)[0] as keyof SubmissionState) ===
        "WaitingForReview"
    );
  }

  getSubmissionState(principal: string) {
    if (this.isRejected(principal)) {
      return "Rejected";
    }
    if (this.isWaitingForReview(principal)) {
      return "WaitingForReview";
    }
    if (this.isAccepted(principal)) {
      return "Accepted";
    }

    throw new Error("Failed to get submission state");
  }
}
