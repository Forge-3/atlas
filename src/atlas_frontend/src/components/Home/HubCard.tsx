import React from "react";

interface AmbassadorCardProps {
  ambassadorsCount: number, country: string 
}

function AmbassadorCard({ ambassadorsCount, country }: AmbassadorCardProps) {
  return (
    <div className="flex w-full flex-col items-center  border border-white border-solid  rounded-t-full ">
      <div className="md:w-[94px] md:h-[94px] dlg:w-[100px] dlg:h-[100px] mb-3 rounded-full flex items-center justify-center">
        <img src={`/hubs/logo-${country.toLowerCase()}-square.jpg`} alt={`Internet Computer ${country} HUB logo`} draggable="false" className="rounded-full"/>
      </div>
      <div className="md:text-3xl dlg:text-4xl md:font-semibold dlg:font-bold">
        {ambassadorsCount}
      </div>
      <div className="mt-1 text-xs dlg:text-sm md:font-normal dlg:font-medium">
        Ambassador
      </div>
      <div className="self-stretch md:px-2 dlg:px-4 py-3 mt-4 md:font-medium dlg:font-semibold leading-3 rounded-xl border-t border-white border-solid">
        Join
        <br />
        ICP HUB <br />
        {country}
      </div>
    </div>
  );
}

export default AmbassadorCard;
