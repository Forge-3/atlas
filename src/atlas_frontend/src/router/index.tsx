import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "../components/Footer.tsx";
import Navbar from "../components/Navbar/index.tsx";
import Home from "../components/Home/index.tsx";
import MissionApp from "../components/MissionApp/index.tsx";

const Router = () => {
  return (
    <BrowserRouter>
      <div className="block component bg-black bg-opacity-25 backdrop-blur-[2px] fixed inset-0 z-[1009] w-screen h-screen" data-aria-hidden="true" aria-hidden="true"></div>
      <div className="relative bg-gradient-to-b from-[#1E0F33] to-[#9173FF]/50 bg-[#1E0F33] min-h-screen flex flex-col justify-between">
        <div>
          <Navbar />
          <main>
            <Routes>{<Route path="/" element={<Home />} />}</Routes>
            <Routes>{<Route path="/app" element={<MissionApp />} />}</Routes>
          </main>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default Router;
