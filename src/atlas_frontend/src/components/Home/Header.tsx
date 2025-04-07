import React from "react";

const Header =  () => {
  return (
    <header className="flex md:h-[350px] md2:h-[450px] dlg:h-[580px] bg-no-repeat w-full bg-[url(/background-a.png)] bg-center bg-right bg-contain bg-no-repeat mt-32 container mx-auto">
      <div className="flex items-end pb-6 dlg:pb-10 pl-20">
        <div className="text-white">
          <h2 className="font-bold md:text-3xl dlg:text-5xl">Join</h2>
          <h2 className="font-bold md:text-3xl dlg:text-5xl">Ambassador</h2>
          <h2 className="font-bold md:text-3xl dlg:text-5xl">Program</h2>
          <p className="font-[380] md:text-xl dlg:text-2xl mt-6">
            Atlas is a community of ambassadors promoting
          </p>
          <h3 className="font-medium mt-2 md:text-xl text-3xl">
            ICP HUBS NETWORK
          </h3>
        </div>
      </div>
    </header>
  );
};

export default Header