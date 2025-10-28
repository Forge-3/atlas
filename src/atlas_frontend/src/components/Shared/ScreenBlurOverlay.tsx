import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

const ScreenBlurOverlay = () => {
  const isScreenBlur = useSelector((state: RootState) => state.app.isScreenBlur);
  if (!isScreenBlur) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/25"
      style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
    />
  );
};

export default ScreenBlurOverlay;
