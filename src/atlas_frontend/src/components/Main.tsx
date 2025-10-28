import React from "react";
import Navbar from "./Navbar";
import Router from "../router";
import Footer from "./Footer";
import ScreenLoadingOverlay from "./Shared/ScreenLoadingOverlay";
import ScreenBlurOverlay from "./Shared/ScreenBlurOverlay";
import { useLocation } from "react-router-dom";

const Main = () => {
  const location = useLocation();

  const isCreateTaskPage = location.pathname.endsWith('/create-task');
  const isSubmissionsPage = location.pathname.endsWith('/summations');
  const isSpacePage = location.pathname.includes('/space/');
  
  const bgMain = !isSpacePage ?
    { backgroundImage: 'linear-gradient(to bottom, var(--color-background) 0%, var(--color-primary) 100%)' } :
    (isCreateTaskPage || isSubmissionsPage) ?
    { backgroundImage: 'linear-gradient(to bottom, var(--color-background) 0%, var(--color-primary) 100%)' } :
    { backgroundColor: `var(--color-background)` };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <ScreenLoadingOverlay />
      <ScreenBlurOverlay />
      <div style = {bgMain}>
        <Navbar />
          <Router />
      </div>
      <Footer/>
    </div>
  );
};

export default Main;
