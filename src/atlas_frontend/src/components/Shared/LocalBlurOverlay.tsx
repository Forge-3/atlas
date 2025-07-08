import React from "react";
import AstronautIcon from "./AstronautIcon";

interface LocalBlurOverlayProps {
  isLoading: boolean;
}

const LocalBlurOverlay = ({ isLoading }: LocalBlurOverlayProps) => {
  if (!isLoading) return null;

  return (
    <div className="w-full h-[calc(100vh-340px)]">
      <div className="backdrop-blur-sm z-10 flex justify-center items-center w-full h-full">
        <AstronautIcon />
      </div>
    </div>
  );
};

export default LocalBlurOverlay;
