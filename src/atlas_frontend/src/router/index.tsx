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
  HELP,
  REVIEW_SUMMATIONS_PATH,
  SPACE_BUILDER_PATH,
  SPACE_EDIT_PATH,
  SPACE_PATH,
  SPACES_PATH,
  TASK_PATH,
  WALLET,
} from "./paths.ts";
import Submissions from "../components/Submissions/index.tsx";
import Wallet from "../components/Wallet/index.tsx";
import Help from "../components/Help/index.tsx";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path={SPACES_PATH} element={<SpacesList />} />
      <Route path={SPACE_PATH} element={<Space />} />
      <Route path={SPACE_BUILDER_PATH} element={<SpaceBuilder />} />
      <Route path={SPACE_EDIT_PATH} element={<SpaceBuilder />} />
      <Route path={DISCORD_CALLBACK_PATH} element={<DiscordCallback />} />
      <Route path={TASK_PATH} element={<Task />} />
      <Route path={REVIEW_SUMMATIONS_PATH} element={<Submissions />} />
      <Route path={WALLET} element={<Wallet />} />
      <Route path={HELP} element={<Help />} />
    </Routes>
  );
};

export default Router;
