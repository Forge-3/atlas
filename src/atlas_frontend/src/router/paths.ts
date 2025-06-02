import type { Principal } from "@dfinity/principal";

export const SPACES_PATH = "/space";
export const SPACE_PATH = SPACES_PATH + "/:spacePrincipal";
export const TASK_PATH = SPACE_PATH + "/:taskId";
export const REVIEW_SUMMATIONS_PATH = TASK_PATH + "/summations";

export const SPACE_BUILDER_PATH = "/space/builder";
export const DISCORD_CALLBACK_PATH = "/auth/discord/callback";

export const getSpacePath = (principal: Principal) =>
  SPACE_PATH.replace(":spacePrincipal", principal.toText());
export const getTaskPath = (principal: Principal, taskId: string) =>
  TASK_PATH.replace(":spacePrincipal", principal.toText()).replace(
    ":taskId",
    taskId
  );
  export const getSubmissionsPath = (principal: Principal, taskId: string) =>
    REVIEW_SUMMATIONS_PATH.replace(":spacePrincipal", principal.toText()).replace(
      ":taskId",
      taskId
    );