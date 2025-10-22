import React, { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import type { ExternalLinks } from "../../canisters/atlasSpace/types";
import type { Principal } from "@dfinity/principal";
import SpaceExternalLinks from "./SpaceExternalLinks";
import { BlockchainUser } from "../../store/slices/userSlice";
import SpaceInfoBar from "./SpaceInfoBar";

interface SpaceHeaderProps {
  spaceName?: string | null;
  spaceDescription?: string | null;
  spaceLogo?: string | null;
  spaceBackground?: string | null;
  externalLinks?: ExternalLinks | null;
  userInfo?: BlockchainUser | null;
  spacePrincipal?: Principal | null;
}

const SpaceHeader = ({
  spaceName,
  spaceDescription,
  spaceLogo,
  spaceBackground,
  externalLinks,
  userInfo,
  spacePrincipal,
}: SpaceHeaderProps) => {
  const canAdministrate = userInfo && spacePrincipal && userInfo.canAdministrate(spacePrincipal);
  const isSpaceLead = userInfo?.isSpaceLead() ?? false;
  const isAdmin = canAdministrate || isSpaceLead;
  const variant = isAdmin ? 'bright' : 'default';
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative w-full rounded-t-xl mb-4 md:mb-8">
      {spaceBackground ? (
      <img
        src={spaceBackground}
        draggable="false"
        className="w-full h-full object-cover"
      />
      )  : (
        <div className={`${isAdmin? `bg-dark/40` : `bg-background/20`} w-full h-24 sm:h-48 md:h-64 lg:h-80`}></div>
      )}
      <div className="block md:hidden">
        <div className="flex flex-col px-3 -mt-8 relative z-10">
          <div className="flex flex-row items-end w-full">
            <div className="flex-none">
              {spaceLogo ? (
                <img
                  src={spaceLogo}
                  draggable="false"
                  className="rounded-lg w-18 h-18"
                />
              ) : (
                <div className={`${isAdmin? `bg-dark/40` : `bg-background/20`} rounded-xl m-[3px] w-18 h-18`}></div>
              )}
            </div>
            <div className="flex flex-col justify-end ml-2 w-full">
              <h1 className="text-white font-montserrat font-semibold text-base leading-tight mb-2">
                {spaceName || "Space Name"}
              </h1>
            </div>
          </div>
        </div>
        <div
          className={`mt-2 flex flex-col mx-3 px-3 text-white shadow-md font-montserrat font-medium text-sm p-2 rounded-lg ${
            variant === 'bright' ? 'bg-dark/20' : 'bg-background/20'
          }`}
        >
          <p className={!expanded ? "line-clamp-2" : ""}>
            {spaceDescription}
          </p>
          <div>
            {spaceDescription && spaceDescription.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 text-xs text-white/80 hover:text-white"
              >
                {expanded ? (
                  <>
                    Show less <IoChevronUp />
                  </>
                ) : (
                  <>
                    Show more <IoChevronDown />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        {externalLinks && (
          <div className="flex flex-row justify-end items-center mt-2 -mb-2 sm:mt-4 px-3 sm:px-6 gap-2 text-white">
            <SpaceExternalLinks externalLinks={externalLinks} userInfo={userInfo} spacePrincipal={spacePrincipal}/>
          </div>
        )}
        <div>
          
        </div>
      </div>
      <div className="hidden md:flex flex-col lg:flex-row px-3 sm:px-6 md:px-10 -mt-8 relative">
        <div className="flex flex-row items-end w-full">
          <div className="flex-none">
            {spaceLogo ? (
              <img
                src={spaceLogo}
                draggable="false"
                className="rounded-lg w-18 h-18 sm:w-24 sm:h-24 md:w-36 md:h-36"
              />
            ) : (
              <div className={`${isAdmin? `bg-dark/40` : `bg-background/20`} rounded-xl m-[3px] w-18 h-18 md:w-36 md:h-36`}></div>
            )}
          </div>
          <div className="flex flex-col justify-end ml-1 sm:ml-3 md:ml-4 w-full">
            <h1 className="text-white font-montserrat font-semibold text-lg md:text-xl xl:text-3xl leading-tight mb-2">
              {spaceName || "Space Name"}
            </h1>
            <div className="flex flex-row items-center w-full gap-4">
              <div
                className={`text-white shadow-md font-montserrat font-medium text-base xl:text-xl p-2 md:p-3 rounded-lg w-full ${
                  variant === 'bright' ? 'bg-dark/20' : 'bg-background/20'
                }`}
              >
                {spaceDescription}
              </div>
              {externalLinks && (
                <div className="flex-none">
                  <SpaceExternalLinks externalLinks={externalLinks} userInfo={userInfo} spacePrincipal={spacePrincipal}/>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <SpaceInfoBar userInfo={userInfo} spacePrincipal={spacePrincipal}/>
    </div>
  );
};

export default SpaceHeader;