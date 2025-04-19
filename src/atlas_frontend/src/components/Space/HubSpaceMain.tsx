import React from "react";
import { FiFilter, FiStar } from "react-icons/fi";
import Button from "../Shared/Button.tsx";
import SpaceCard from "./SpaceCard/index.tsx";

interface SpaceMainArgs {
  country: string;
  description: string;
  backgroundImg: string;
  avatarImg: string;
}

const HubSpaceMain = ({
  country,
  description,
  backgroundImg,
  avatarImg,
}: SpaceMainArgs) => {
  const capitalCountry = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <div className="relative w-full rounded-t-xl bg-[#1E0F33] mb-1">
          <div className="px-8 py-8">
            <div
              className={`bg-[url(${backgroundImg})] w-full h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex justify-end place-items-end`}
            >
              <div className="flex items-center justify-center gap-2 m-4 text-4xl text-white font-roboto">
                <img src="/logos/icp-bold-uppercase.svg" draggable="false" />{" "}
                <span>{capitalCountry}</span>
              </div>
            </div>
            <div className="flex mt-4">
              <div className="flex flex-none bg-white rounded-3xl">
                <img
                  src={avatarImg}
                  draggable="false"
                  className="rounded-3xl m-[5px] w-full"
                />
              </div>
              <div className="mx-4 my-1 text-white font-montserrat">
                <h1 className="text-4xl font-semibold">
                  ICP HUB {capitalCountry}
                </h1>
                <p>{description}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative w-full bg-[#1E0F33] mb-1">
          <div className="flex px-8 py-6 justify-betwee">
            <div className="flex gap-4">
              <Button className="flex gap-1">
                <FiFilter /> Sorting
              </Button>
              <Button className="flex gap-1">
                <FiStar /> Newest
              </Button>
            </div>
          </div>
        </div>
        <div className="relative w-full bg-[#1E0F33] rounded-b-xl ">
          <div className="grid gap-4 px-8 py-6">
            <SpaceCard type="ongoing" points="100" tokens="0.2 ICP"/>
            <SpaceCard type="starting" startingIn="3 days" points="1000" tokens="0.5 ICP"/>
            <SpaceCard type="expired" points="1500" tokens="1 ICP"/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubSpaceMain;
