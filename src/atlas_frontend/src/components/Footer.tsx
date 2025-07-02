import React from "react";
import { BsTwitterX } from "react-icons/bs";

const Footer = () => {
  return (
    <div className="flex flex-col items-center self-stretch px-20 pt-10 pb-12 mt-0 w-full text-lg font-medium leading-tight text-center text-violet-500 bg-[#1E0F33] max-md:px-5 max-md:max-w-full">
      <div className="px-20 py-5 max-w-full rounded-3xl text-[#9173FF] bg-[#150826] bg-opacity-50 max-md:px-5 w-full flex gap-6 justify-between">
        <a href="/help">Terms of Use</a>
        <a href="https://x.com/ICPHUBS" target="_blank" rel="noreferrer" className="flex items-center justify-center">
          <BsTwitterX className="w-6 h-6" />
        </a>
      </div>
      <img
        loading="lazy"
        src="/logos/footer-logo.png"
        alt="Huge logo of Atlas"
        className="object-contain mt-12 w-full aspect-[5.75]  max-w-[1314px] max-md:max-w-full"
        draggable="false"
      />
    </div>
  );
};

export default Footer;
