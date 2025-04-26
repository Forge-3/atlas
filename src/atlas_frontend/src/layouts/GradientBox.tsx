import React from "react";

interface GradientBoxProps {
  children: React.ReactNode
}

const GradientBox = ({ children }: GradientBoxProps) => {
  return (
    <div className="w-full px-3">
      <div className="relative mb-6 pb-10 w-full rounded-xl bg-gradient-to-b from-[#1E0F33]/80 to-[#9173FF]/10">
        {children}
      </div>
    </div>
  );
};

export default GradientBox;
