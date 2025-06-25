import React from "react";
import { BsTwitterX } from "react-icons/bs";

const Footer = () => {
  return (
    <div className="flex flex-col items-center self-stretch px-20 pt-10 pb-12 mt-0 w-full text-lg font-medium leading-tight text-center text-violet-500 bg-[#1E0F33] max-md:px-5 max-md:max-w-full">
      <div className="gap-y-4 gap-x-10 px-20 py-5 max-w-full rounded-3xl text-[#9173FF] bg-[#150826] bg-opacity-50 max-md:px-5 w-full grid grid-cols-4">
        <a href="/help#eligibility">Eligibility</a>
        <a href="/help#responsibilities">Responsibilities</a>
        <a href="/help#content-guidelines">Content Guidelines</a>
        <a href="/help#intellectual-property">Intellectual Property</a>
        <a href="/help#legal-compliance">Legal Compliance</a>
        <a href="/help#restrictions">Restrictions</a>
        <a href="/help#termination">Termination</a>
        <a href="/help#data-privacy">Data Privacy</a>
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
