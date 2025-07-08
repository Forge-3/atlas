import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import AstronautIcon from "./AstronautIcon"

const ScreenLoadingOverlay = () => {
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 sm:backdrop-blur-sm backdrop-blur-none z-40">
      <AstronautIcon />
    </div>
  );
};

export default ScreenLoadingOverlay;
