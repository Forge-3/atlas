import React from "react";

const Header = () => {
  return (
    <header
      className="
    flex bg-no-repeat w-full bg-center bg-right bg-contain relative
    pt-60
    h-[300px]
    max-h-[62.5rem]
    container mx-auto                               
    sm:h-[calc(100vh-250px)]
    sm:max-h-[35rem]
    md:max-h-[45rem]
    lg:max-h-[45rem]
  "
    >
      <img
        className="
        absolute -right-20 -top-6 z-0
        h-auto w-auto max-h-[50vh] max-w-[50vw]-md       
        sm:-right-56 sm:h-100 sm:z-0
        sm:max-h-screen sm:max-w-screen-lg           
        md:max-w-screen-lg
        lg:max-w-screen-2xl
        lg:max-h-[1000px]
        xl:min-h-[1060px]                       
        "
        src="/background-a-header.png"
        draggable="false"
        
      />
      <div className="relative flex items-end pb-32 pl-4 md:pl-20 z-1">
        <div className="text-white font-montserrat">
          <span className="font-bold text-2xl sm:text-4xl md:text-[3rem] leading-tight sm:leading-tight md:leading-[3.5rem]">
            <h2>
              Join <br />
              Champion <br />
              Program
            </h2>
          </span>
          <div className="mt-4 sm:mt-8">
            <p className="font-[380] text-base sm:text-xl md:text-3xl">
              Atlas is a community of Champions promoting
            </p>
            <h3 className="text-base sm:text-lg md:text-2xl font-semibold">
              ICP HUBS NETWORK
            </h3>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
