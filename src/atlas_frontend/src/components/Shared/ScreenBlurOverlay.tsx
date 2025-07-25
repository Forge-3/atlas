import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

const ScreenBlurOverlay = () => {
  const isScreenBlur = useSelector((state: RootState) => state.app.isScreenBlur);
  if (!isScreenBlur) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 sm:backdrop-blur-sm backdrop-blur-none z-40">
    </div>
  );
};

export default ScreenBlurOverlay;
