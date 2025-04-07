import React from "react";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import Footer from "../components/Footer.tsx";
import Navbar from "../components/Navbar/index.tsx";
import Home from "../components/Home/index.tsx";

const Router = () => {
  return (
    <BrowserRouter>
      <div className="relative bg-gradient-to-b from-[#1E0F33]/80 to-[#9173FF]/10 bg-[#3d2a6b]">
        <Navbar />
        <main>
          <Routes>{<Route path="/" element={<Home />} />}</Routes>
          <Routes>{<Route path="/app" element={<Home />} />}</Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default Router; 