import React from "react";
import Button from "../Shared/Button";
import { SPACES_PATH } from "../../router/paths";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-background/20 to-primary/60">
      <header
        className="
        relative 
        flex 
        items-end
        pt-60
        h-[500px]
        md:h-[740px]
        bg-no-repeat bg-center bg-contain 
        container mx-auto
        overflow-hidden
      "
      >
        <img
          className="
          absolute
          top-[50px]
          sm:top-12
          z-0
          w-[550px]
          h-[400px]
          sm:w-[700px]
          sm:h-[400px]
          md:w-[900px]
          md:h-[600px]
          lg:w-[1530px] 
          lg:h-auto 
          max-w-none 
          object-cover
        "
          src="/background-a-header.png"
          draggable="false"
          alt="Background Graphic"
        />

        <div className="relative flex px-4 pb-24 md:pb-32">
          <div className="text-white font-montserrat">
            <h4 className="text-[26px] md:text-[42px] font-semibold leading-tight">
              Elevate Your Impact. <br />
              Get Rewarded.
            </h4>
            <div className="mt-4 sm:mt-8">
              <h3 className="font-montserrat font-medium max-w-[529px] text-[15px] md:text-h3">
                ATLAS is the official champion program of the <br />
                ICP HUBS NETWORK — designed for passionate <br />
                community members ready to promote the <br />
                Internet Computer&apos;s global vision.
              </h3>
              <Button
                variant="publish"
                className="mt-6 px-3 font-montserrat text-[12px] md:text-base font-semibold"
                onClick={() => navigate(SPACES_PATH)}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
