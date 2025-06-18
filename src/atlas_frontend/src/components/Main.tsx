import React from "react";
import { useSelector } from "react-redux";
import Navbar from "./Navbar";
import type { RootState } from "../store/store";
import Router from "../router";
import Footer from "./Footer";

const Main = () => {
  const isScreenBlur = useSelector(
    (state: RootState) => state.app.isScreenBlur
  );

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 sm:backdrop-blur-sm backdrop-blur-none z-40 ${isScreenBlur ? "" : "hidden overflow-none"}`}
      ></div>
      <div className="bg-gradient-to-b from-[#1E0F33] to-[#9173FF]/50 bg-[#1E0F33] min-h-screen flex flex-col justify-between">
        <div>
          <Navbar />
          <main>
            <Router />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Main;
