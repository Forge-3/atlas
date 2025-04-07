import React from "react";

const Header = () => {
  return (
    <header className="flex bg-no-repeat w-full bg-center bg-right bg-contain bg-no-repeat pt-60 container mx-auto relative">
      <img
        className="absolute -right-56 -top-28 w-[65rem] z-0"
        src="/background-a-header.png"
        draggable="false"
      />
      <div className="relative flex items-end pb-6 dlg:pb-10 pl-20 z-1">
        <div className="text-white font-montserrat">
          <span className="font-bold text-4xl">
            <h2>Join</h2>
            <h2>Ambassador</h2>
            <h2>Program</h2>
          </span>
          <div className="mt-8">
            <p className="font-[380] text-2xl">
              Atlas is a community of ambassadors promoting
            </p>
            <h3 className="text-2xl font-semibold">ICP HUBS NETWORK</h3>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
