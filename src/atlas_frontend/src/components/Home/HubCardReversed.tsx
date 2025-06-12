import React from "react";

interface HubCardReversedProps{
  ambassadorsCount: number, country: string 
}

const HubCardReversed = ({ ambassadorsCount, country }: HubCardReversedProps) => {
  return (
    <div className="flex flex-col items-center border rounded-t-xl rounded-b-full border-white border-solid ">
      <div className="self-stretch md:px-2 dlg:px-4 py-2.5 md:font-medium dlg:font-semibold  ed-b-md rounded-t-xl  border-b">
        Join
        <br />
        ICP HUB
        <br />
        {country}
      </div>
      <div className="mt-5 md:text-3xl dlg:text-4xl md:font-semibold dlg:font-bold">
        {ambassadorsCount}
      </div>
      <div className="mt-3 mb-0 text-xs dlg:text-sm  font-medium max-md:mb-2.5">
        Ambassador
      </div>
      <div className="md:w-[94px] md:h-[94px] dlg:w-[100px] dlg:h-[100px] mt-3 rounded-full flex items-center justify-center">
      <img src={`/hubs/logo-${country.toLowerCase()}-square.jpg`} alt={`Internet Computer ${country} HUB logo`} draggable="false" className="rounded-full"/>
      </div>
    </div>
  );
}

export default HubCardReversed
