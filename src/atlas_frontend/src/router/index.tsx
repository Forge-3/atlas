import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../components/Home/index.tsx";
import Space from "../components/Space/index.tsx";
import DiscordCallback from "../components/Integrations/DiscordCallback.tsx";
import SpaceBuilder from "../components/Space/SpaceBuilder.tsx";
import SpacesList from "../components/Space/SpacesList/index.tsx";
import Task from "../components/Task/index.tsx";
import {
  DISCORD_CALLBACK_PATH,
  REVIEW_SUMMATIONS_PATH,
  SPACE_BUILDER_PATH,
  SPACE_PATH,
  SPACES_PATH,
  TASK_PATH,
} from "./paths.ts";
import Submissions from "../components/Submissions/index.tsx";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path={SPACES_PATH} element={<SpacesList />} />
      <Route path={SPACE_PATH} element={<Space />} />
      <Route path={SPACE_BUILDER_PATH} element={<SpaceBuilder />} />
      <Route path={DISCORD_CALLBACK_PATH} element={<DiscordCallback />} />
      <Route path={TASK_PATH} element={<Task />} />
      <Route path={REVIEW_SUMMATIONS_PATH} element={<Submissions />} />
    </Routes>
  );
};

export default Router;
