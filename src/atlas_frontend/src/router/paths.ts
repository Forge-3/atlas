import type { Principal } from "@dfinity/principal";

export const SPACES_PATH = "/space";
export const SPACE_PATH = SPACES_PATH + "/:spacePrincipal";
export const TASK_PATH = SPACE_PATH + "/:taskId";
export const CREATE_TASK_PATH = SPACE_PATH + "/create-task";
export const EDIT_TASK_PATH = TASK_PATH + "/edit";

export const SPACE_BUILDER_PATH = SPACES_PATH + "/builder";
export const SPACE_EDIT_PATH = SPACE_BUILDER_PATH + "/:spacePrincipal";
export const DISCORD_CALLBACK_PATH = "/auth/discord/callback";
export const TWITTER_CALLBACK_PATH = "/auth/x/callback";
export const WALLET_PATH = "/wallet";
export const HELP_PATH = "/help";
export const ADMIN_PATH = "/admin";

export const getSpacePath = (principal: Principal) =>
  SPACE_PATH.replace(":spacePrincipal", principal.toText());
export const getTaskPath = (principal: Principal, taskId: string) =>
  TASK_PATH.replace(":spacePrincipal", principal.toText()).replace(
    ":taskId",
    taskId
  );
export const getSpaceEditPath = (principal: Principal) =>
  SPACE_EDIT_PATH.replace(":spacePrincipal", principal.toText());

export const getCreateTaskPath = (spacePrincipal: Principal) =>
  CREATE_TASK_PATH.replace(":spacePrincipal", spacePrincipal.toText());

export const getEditTaskPath = (spacePrincipal: Principal, taskId: string) =>
  EDIT_TASK_PATH.replace(":spacePrincipal", spacePrincipal.toText()).replace(
    ":taskId",
    taskId
  );