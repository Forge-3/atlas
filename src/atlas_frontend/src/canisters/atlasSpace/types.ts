import type {
  State,
  SubmissionData,
  TaskType,
} from "../../../../declarations/atlas_space/atlas_space.did";

export interface TaskData {
  submissionData: SubmissionData;
  taskType: keyof TaskType;
}

export interface TasksData {
  [key: string]: {
    submissionData: SubmissionData;
    taskType: keyof TaskType;
  };
}

export interface UserSubmissionsData {
  [key: string]: TasksData;
}

export interface StorableState extends Omit<State, 'space_symbol' | 'space_background' | 'space_logo' | 'external_links'>{
  space_symbol: string | null;
  space_background: string | null;
  space_logo: string | null;
  external_links: ExternalLinks
}

export interface ExternalLinks {
    x: string | null;
    telegram: string | null;
    discord: string | null;
    linkedIn: string | null;
  };