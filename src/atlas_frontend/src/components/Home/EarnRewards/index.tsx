import React from "react";
import ListItem from "./ListItem";

const EarnRewards = () => {
  return (
    <div className="rounded-2xl w-full my-6 bg-cover bg-[url(/reward-bg-img.png)] font-montserrat [mix-blend-mode:luminosity]
                flex flex-col md:flex-row items-center md:items-end md:justify-between px-4 py-6 md:px-8">
    <div className="flex flex-col justify-center text-center w-full mb-6
                    md:text-left md:mb-0 md:w-[50%] md:flex-shrink-0 md:pl-0 md:self-end">
        <h2 className="font-semibold text-xl sm:text-2xl md:text-2xl dlg:text-3xl dxl:text-4xl text-white">
            Earn rewards by being ICP Ambassador
        </h2>
    </div>
    <div className="flex flex-col w-full md:w-[50%] justify-center px-0 gap-2 sm:gap-3
                    md:items-start md:pr-4 md:pl-0">
        <ListItem>
            Signup for Atlas with your Discord and join Atlas Server
        </ListItem>
        <div className="flex w-full items-center justify-center md:justify-start">
            <img
              src="/icons/down-arrow-in-circle.png"
              alt="arrow icon"
              className="h-[20px] sm:h-[24px] mx-auto"
              draggable="false"
            />
        </div>
        <ListItem>Complete Quests and earn points</ListItem>
        <div className="flex w-full items-center justify-center md:justify-start">
            <img
              src="/icons/down-arrow-in-circle.png"
              alt="arrow icon"
              className="h-[20px] sm:h-[24px] mx-auto"
              draggable="false"
            />
        </div>
        <ListItem>Invite friends and earn points</ListItem>
        <img
            src="/icons/down-arrow-in-circle.png"
            alt="arrow icon"
            className="h-[20px] sm:h-[24px] mx-auto"
            draggable="false"
        />
        <ListItem>Get new levels, complete in leaderboard and earn points</ListItem>
        <img
            src="/icons/down-arrow-in-circle.png"
            alt="arrow icon"
            className="h-[20px] sm:h-[24px] mx-auto"
            draggable="false"
        />
        <ListItem>Redeem your rewards as you progress further</ListItem>
    </div>
</div>
  );
};

export default EarnRewards;
