import React from "react";

interface ReferralCardProps {
  title: string;
  subtitle: string;
}

const ReferralCard = ({
  title,
  subtitle,
}: ReferralCardProps) => {
  return (
    <div className="rounded-2xl pl-3  bg-[#9173FF] h-48 w-80 sm:h-64 md:h-96 lg:h-120 flex flex-col justify-between shadow-lg shadow-[#1E0F33]/50 max-w-[418px] sm:w-[45%]  dlg:w-[30%]">
      <div className="flex gap-2 md:gap-4 p-4">
        <img
          src="/logos/small-white-logo.png"
          alt="atlas"
          className="w-6 h-5 md:w-11 md:h-7 "
        />
        <h2 className="text-white text-base md:text-2xl font-semibold">{title}</h2>
      </div>
      <div className="w-[90%] p-4">
        <p className="text-white font-medium text-base md:text-xl md:text-xl">{subtitle}</p>
      </div>
    </div>
  );
};

export default ReferralCard;
