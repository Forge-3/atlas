import React from "react";
import AstronautLoading from "../../icons/loader.svg?react";

interface AstronautIconProps {
  className?: string;
}

const AstronautIcon = ({ className = "w-20 h-20" }: AstronautIconProps) => (
  <AstronautLoading className={`animate-rotate-sway object-contain ${className}`} />
);

export default AstronautIcon;
