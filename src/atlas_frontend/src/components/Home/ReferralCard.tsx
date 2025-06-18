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
    <div className="rounded-2xl pl-3  bg-[#9173FF] h-96 flex flex-col justify-between shadow-lg shadow-[#1E0F33]/50 max-w-[418px] sm:w-[45%]  dlg:w-[30%]">
      <div className="flex gap-4 p-4">
        <img
          src="/logos/small-white-logo.png"
          alt="atlas"
          className="w-[43px] h-[30px] "
        />
        <h2 className="text-white text-2xl font-semibold">{title}</h2>
      </div>
      <div className="w-[75%] p-4">
        <p className="text-white font-medium text-xl">{subtitle}</p>
      </div>
    </div>
  );
};

export default ReferralCard;
