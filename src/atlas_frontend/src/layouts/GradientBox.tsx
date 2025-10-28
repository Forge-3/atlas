import React from "react";

interface GradientBoxProps {
  children: React.ReactNode
}

const GradientBox = ({ children }: GradientBoxProps) => {
  return (
    <div className="w-full px-8">
      <div className="relative mb-6 pb-10 w-full rounded-xl bg-dark/20">
        {children}
      </div>
    </div>
  );
};

export default GradientBox;
