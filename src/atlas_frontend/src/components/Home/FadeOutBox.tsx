import React from "react";

interface FadeOutBoxProps {
  children: React.ReactNode;
}

const FadeOutBox = ({ children }: FadeOutBoxProps) => {
  return (
    <div className="max-w-[418px] sm:w-[45%] dlg:w-[30%] h-[28rem] rounded-t-3xl bg-gradient-to-t from-transparent to-[#9173FF]">
      {children}
    </div>
  );
};

export default FadeOutBox;