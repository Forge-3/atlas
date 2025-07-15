import type { Principal } from "@dfinity/principal";
import type {
  SubmissionData,
  SubmissionState,
  TaskType,
} from "../../../../declarations/atlas_space/atlas_space.did";
import type { UserSubmissionsData } from "./types";

export const getUsersSubmissions = (tasks: { [key: string]: TaskType }) => {
  const data: UserSubmissionsData = {};

for (const [subtaskIdStr, task] of Object.entries(tasks)) {
  const foundType = Object.keys(task)[0] as keyof TaskType;
  const taskData = task[foundType] as { submission: [Principal, SubmissionData][] };

  for (const [principal, submissionData] of taskData.submission) {
    const principalText = principal.toText();
    if (!data[principalText]) {
      data[principalText] = {};
    }
    data[principalText][subtaskIdStr] = {
      submissionData,
      taskType: foundType,
    };
  }
}

return new UserSubmissions(data);
}

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
