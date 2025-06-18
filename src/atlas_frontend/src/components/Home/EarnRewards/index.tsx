import React from "react";
import ListItem from "./ListItem";

const EarnRewards = () => {
  return (
    <div className="rounded-2xl w-full flex justify-between my-8 bg-cover bg-[url(/reward-bg-img.png)] font-montserrat">
      <div className="flex flex-col justify-end px-5 mb-4 py-6">
        <h2 className="font-semibold md:text-2xl dlg:text-3xl dxl:text-4xl text-white ">
          Earn rewards by being ICP Ambassador
        </h2>
      </div>
      <div className="flex w-[65%] justify-end items-center">
        <div className="flex flex-col justify-center py-6 px-8 gap-3">
          <ListItem>
            Signup for Atlas with your Discord and join Atlas Server
          </ListItem>
          <div className="flex w-full items-center justify-center">
            <img
              src="/icons/down-arrow-in-circle.png"
              alt="arrow icon"
              className="h-[24px] mx-auto"
              draggable="false"
            />
          </div>
          <ListItem>Complete Quests and earn points</ListItem>
          <div className="flex items-center justify-center">
            <img
              src="/icons/down-arrow-in-circle.png"
              alt="arrow icon"
              className="h-[24px] mx-auto"
              draggable="false"
            />
          </div>
          <ListItem>Invite friends and earn points</ListItem>
          <img
            src="/icons/down-arrow-in-circle.png"
            alt="arrow icon"
            className="h-[24px] mx-auto"
            draggable="false"
          />
          <ListItem>Get new levels, complete in leaderboard and earn points</ListItem>
          <img
            src="/icons/down-arrow-in-circle.png"
            alt="arrow icon"
            className="h-[24px] mx-auto"
            draggable="false"
          />
          <ListItem>Redeem your rewards as you progress further</ListItem>
        </div>
      </div>
    </div>
  );
};

export default EarnRewards;
