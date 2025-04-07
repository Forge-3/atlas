import React from "react";
import { BsTwitterX } from "react-icons/bs";

const Footer = () => {
  return (
    <div className="flex flex-col h-[450px] items-center self-stretch px-20 pt-10 pb-12 mt-0 w-full text-xl font-medium leading-tight text-center text-violet-500 bg-[#1E0F33] max-md:px-5 max-md:max-w-full">
      <div className="flex flex-wrap gap-10 px-20 py-5 max-w-full rounded-3xl text-[#9173FF] bg-[#150826] bg-opacity-50 w-[1314px] max-md:px-5">
        <a href="/privacy-policy" className="grow shrink w-[134px]">
          Privacy Policy
        </a>
        <a href="/help" className="grow shrink w-[117px]">
          Help Center
        </a>
        <a href="https://x.com" target="_blank" rel="noreferrer">
          <BsTwitterX className="w-6 h-6" />
        </a>
      </div>
      <img
        loading="lazy"
        src="/logos/footer-logo.png"
        alt="Huge logo of Atlas"
        className="object-contain mt-9 w-full aspect-[5.75]  max-w-[1314px] max-md:max-w-full"
      />
    </div>
  );
};

export default Footer;