import React from "react";
import { BsTwitterX } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { HELP_PATH } from "../router/paths";

const Footer = () => {
    const navigate = useNavigate();
    
  return (
    <div className="flex flex-col items-center self-stretch px-4 pt-10 pb-12 mt-0 w-full text-lg font-medium leading-tight text-center text-violet-500 bg-[#1E0F33]
                sm:px-5 md:px-10 lg:px-20">
      <div className="gap-y-4 gap-x-4 px-4 py-5 w-full rounded-3xl text-[#9173FF] bg-[#150826] bg-opacity-50
                    grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-full">
        <a onClick={() => navigate(HELP_PATH)}>Terms of Use</a>
        <a href="https://x.com/ICPHUBS" target="_blank" rel="noreferrer" className="flex items-center justify-center">
          <BsTwitterX className="w-6 h-6" />
        </a>
    </div>
    <img
        loading="lazy"
        src="/logos/footer-logo.png"
        alt="Huge logo of Atlas"
        className="object-contain mt-12 w-full aspect-[5.75] max-w-[1314px] max-md:max-w-full"
        draggable="false"
    />
</div>
  );
};

export default Footer;
