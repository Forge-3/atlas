import React from "react";

const Header = () => {
  return (
    <header className="flex bg-no-repeat w-full bg-center bg-right bg-contain bg-no-repeat pt-60 container mx-auto relative" style={
      {height: "calc(100vh - 250px)",}
    }>
      <img
        className="absolute -right-56 -top-28 h-100 z-0"
        src="/background-a-header.png"
        draggable="false"
      />
      <div className="relative flex items-end pb-32 pl-20 z-1">
        <div className="text-white font-montserrat">
          <span className="font-bold text-[3rem] leading-[3.5rem]">
          <h2>Join <br/>
            Ambassador <br/>
            Program</h2>
          </span>
          <div className="mt-8">
            <p className="font-[380] text-3xl">
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
