import React from "react";

const DarkBox = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full px-3">
      <div className="relative mb-6 pb-10 w-full rounded-xl bg-[#1E0F33]">
        <div className="px-8 py-8">{children}</div>
      </div>
    </div>
  );
};

export default DarkBox;
