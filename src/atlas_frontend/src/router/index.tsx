import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../components/Home/index.tsx";
import Space from "../components/Space/index.tsx";
import DiscordCallback from "../components/Integrations/DiscordCallback.tsx";
import SpaceBuilder from "../components/Space/SpaceBuilder.tsx";
import SpacesList from "../components/Space/SpacesList/index.tsx";
import Task from "../components/Task/index.tsx";

export const SPACES_PATH = "/space";
export const SPACE_PATH = SPACES_PATH + "/:spacePrincipal";
export const TASK_PATH = SPACE_PATH + "/:taskId";

export const SPACE_BUILDER_PATH = "/space/builder";
export const DISCORD_CALLBACK_PATH = "/auth/discord/callback";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path={SPACES_PATH} element={<SpacesList />} />
      <Route path={SPACE_PATH} element={<Space />} />
      <Route path={SPACE_BUILDER_PATH} element={<SpaceBuilder />} />
      <Route path={DISCORD_CALLBACK_PATH} element={<DiscordCallback />} />
      <Route path={TASK_PATH} element={<Task />} />
    </Routes>
  );
};

export default Router;
