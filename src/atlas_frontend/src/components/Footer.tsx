import React from "react";
import { BsTwitterX } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import { HELP_PATH } from "../router/paths";
import { FaLinkedin } from 'react-icons/fa6';
import { FaGithub } from 'react-icons/fa6';
import { useSelector } from "react-redux";
import { deserialize } from "../store/store";
import { BlockchainUser, selectUserBlockchainData, type StorableUser } from "../store/slices/userSlice";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;

  const isAdmin = userInfo?.isAdmin?.() || userInfo?.isSuperAdmin?.() || userInfo?.isSpaceLead?.() || false;

  const isCreateTaskPage = location.pathname.endsWith('/create-task');
  const isSubmissionsPage = location.pathname.includes('/summations');
  const isSpacePage = location.pathname.includes('/space/');
  const isSpaceRoute = isSpacePage && !(isCreateTaskPage || isSubmissionsPage);

  const logoSrc = isSpaceRoute
    ? (isAdmin ? '/logos/footer-logo-light.svg' : '/logos/footer-logo-dark.svg')
    : '/logos/footer-logo-light.svg';
  
  const bgFooter = isSpaceRoute
    ? (isAdmin ? "bg-background" : "bg-dark")
    : "bg-gradient-to-b from-background to-primary";

  const textColor = isSpaceRoute
    ? (isAdmin ? "text-light" : "text-primary")
    : "text-light";

  const iconColor = isSpaceRoute
    ? (isAdmin ? "text-white" : "text-primary")
    : "text-white";

  const lineColor = isSpaceRoute
    ? (isAdmin ? "bg-white/40" : "bg-primary")
    : "bg-white/40";

  return (
    <div className={`flex-2 flex flex-col pb-12 w-full text-lg font-medium leading-tight ${bgFooter}`}>
      <div className={`w-full h-[1px] ${lineColor} mb-3 md:mb-5`} />
      <div className="max-w-full text-base flex  items-center pb-3 self-end px-5 gap-3 md:gap-6 md:px-20 md:pb-5">
        <h5 className={`font-montserrat font-bold text-[12px] px-4 md:text-[18px] md:px-12 ${textColor}`}>
          Follow us on
        </h5>
        <a href="https://x.com/ICPHUBS" target="_blank" rel="noreferrer" className={`flex ${iconColor} justify-self-end`}>
          <BsTwitterX className="w-5 h-5 md:w-8 md:h-8" />
        </a>
        <a href="https://www.linkedin.com/company/icphub-pl/" target="_blank" rel="noreferrer" className={`flex ${iconColor} justify-self-end`}>
          <FaLinkedin className="w-5 h-5 md:w-8 md:h-8" />
        </a>
        <a href="https://github.com/Forge-3/atlas" target="_blank" rel="noreferrer" className={`flex ${iconColor} justify-self-end`}>
          <FaGithub className=" w-5 h-5 md:w-8 md:h-8" />
        </a>
      </div>
      <div className={`w-full h-[1px] ${lineColor} mb-3`} />
      <img
        loading="lazy"
        src={logoSrc}
        alt="Huge logo of Atlas"
        className="object-contain self-center w-full aspect-[5.75] max-md:max-w-full mt-4 md:mt-8 px-5"
        draggable="false"
      />
      <div className={`w-full h-[1px] ${lineColor} my-3 md:my-6`} />
      <div className="flex max-w-screen flex-wrap justify-center md:flex-2 self-center gap-4 text-light font-montserrat text-[12px] md:text-[18px] font-bold cursor-pointer">
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "eligibility"; }, 100); }} className={textColor}>Eligibility</a>
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "responsibilities"; }, 100); }} className={textColor}>Obligations</a>
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "content-guidelines"; }, 100); }} className={textColor}>Guidelines</a>
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "intellectual-property"; }, 100); }} className={textColor}>Intellectual Property</a>
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "legal-compliance"; }, 100); }} className={textColor}>Legal Compliance</a>
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "termination"; }, 100); }} className={textColor}>Termination</a>
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "restrictions"; }, 100); }} className={textColor}>Restrictions</a>
        <a onClick={() => { navigate(HELP_PATH); setTimeout(() => { window.location.hash = "data-privacy"; }, 100); }} className={textColor}>Data Privacy</a>
      </div>
      <div>
        <p className={`font-montserrat text-[12px] md:text-[18px] font-medium text-center mt-6 ${textColor}`}>
          © ATLAS 2025. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;