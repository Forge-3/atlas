import React from "react";
import { RiLoginBoxLine, RiUserAddLine, RiStairsLine, RiCoinLine } from 'react-icons/ri';
import { MdOutlineCheckBox } from 'react-icons/md';

const EarnRewards = () => {
  return (
    <div className="flex flex-row w-full min-h-[400px] md:min-h-[600px] overflow-hidden shadow-lg my-20 md:my-32">
      <div className="flex flex-col justify-center rounded-lg md:w-1/3 bg-light p-4 gap-2 md:p-8 md:gap-4">
        <img
          src="/icons/referral-coins.png"
          alt="Referral Coins"
          className="w-auto h-auto"
        />
        <h2 className="font-medium font-montserrat text-dark text-[18px] md:text-3xl">
          Earn rewards <br />
          by becoming an <br />
          ICP Champion
        </h2>
      </div>
      <div className="flex flex-col gap-2 md:w-2/3 pl-4">
        <RewardStep
          icon={<RiLoginBoxLine className="text-[40px] md:text-3xl" />}
          text="Sign up for Atlas and join a hub"
        />
        <RewardStep
          icon={<MdOutlineCheckBox className="text-[25px] md:text-3xl" />}
          text="Complete missions"
        />
        <RewardStep
          icon={<RiUserAddLine className="text-[18px] md:text-3xl" />}
          text="Refer friends"
        />
        <RewardStep
          icon={<RiStairsLine className="text-[30px] md:text-3xl" />}
          text="Level up on the leaderboard"
        />
        <RewardStep
          icon={<RiCoinLine className="text-[25px] md:text-3xl" />}
          text="Redeem your rewards"
        />
      </div>
    </div>
  );
};

const RewardStep = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center bg-primary p-2 gap-2 md:p-8 md:gap-4 rounded-lg text-classic font-montserrat h-full">
    {icon}
    <h3 className="text-[12px] md:text-h3  font-medium">{text}</h3>
  </div>
);

export default EarnRewards;
