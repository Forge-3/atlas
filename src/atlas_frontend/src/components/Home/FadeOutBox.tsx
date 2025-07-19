import React from "react";

interface FadeOutBoxProps {
  children: React.ReactNode;
}

const FadeOutBox = ({ children }: FadeOutBoxProps) => {
  return (
    <div className="w-[60%] sm:w-[40%] md:w-[30%] lg:w-[30%] h-[15rem] sm:h-[18rem] rounded-t-3xl bg-gradient-to-t from-transparent to-[#9173FF]">
      {children}
    </div>
  );
};

export default FadeOutBox;