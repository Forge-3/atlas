import React from "react";
import Navbar from "./Navbar";
import Router from "../router";
import Footer from "./Footer";
import ScreenLoadingOverlay from "./Shared/ScreenLoadingOverlay";
import ScreenBlurOverlay from "./Shared/ScreenBlurOverlay";

const Main = () => {

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <ScreenLoadingOverlay />
      <ScreenBlurOverlay />
      <div className="bg-gradient-to-b from-[#1E0F33] to-[#9173FF]/50 bg-[#1E0F33] flex-1">
        <Navbar />
          <Router />
      </div>
      <Footer/>
    </div>
  );
};

export default Main;
