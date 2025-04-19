import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "../components/Footer.tsx";
import Navbar from "../components/Navbar/index.tsx";
import Home from "../components/Home/index.tsx";
import Space from "../components/Space/index.tsx";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store.ts";
import { CALLBACK_PATH } from "../integrations/discord.ts";
import DiscordCallback from "../components/Integrations/DiscordCallback.tsx";

const Router = () => {
  const isScreenBlur = useSelector((state: RootState) => state.app.isScreenBlur)

  return (
    <BrowserRouter>
      <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 sm:backdrop-blur-sm backdrop-blur-none z-40 ${isScreenBlur ? "" : "hidden"}`}></div>
      <div className="relative bg-gradient-to-b from-[#1E0F33] to-[#9173FF]/50 bg-[#1E0F33] min-h-screen flex flex-col justify-between w-screen">
        <div>
          <Navbar />
          <main>
            <Routes><Route path="/" element={<Home />} /></Routes>
            <Routes><Route path="/space" element={<Space />} /></Routes>
            <Routes><Route path={CALLBACK_PATH} element={<DiscordCallback />} /></Routes>
          </main>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default Router;
