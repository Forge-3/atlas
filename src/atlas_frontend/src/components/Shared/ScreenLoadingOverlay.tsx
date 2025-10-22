import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import AstronautIcon from "./AstronautIcon"

const ScreenLoadingOverlay = () => {
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  const isInitialUserLoading = useSelector((state: RootState) => state.app.isInitialUserLoading);
  if (!isLoading && !isInitialUserLoading) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/25 z-40"
      style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}>
      <AstronautIcon />
    </div>
  );
};

export default ScreenLoadingOverlay;
