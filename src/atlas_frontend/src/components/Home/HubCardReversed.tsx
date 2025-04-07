import React from "react";

const HubCardReversed = ({ ambassadorsCount, country }: { ambassadorsCount: number, country: string  }) => {
  return (
    <div className="flex flex-col items-center  border rounded-t-xl rounded-b-full  border-white border-solid ">
      <div className="self-stretch md:px-2 dlg:px-4 py-2.5 md:font-medium dlg:font-semibold  rounded-b-md rounded-t-xl  border-b">
        Join
        <br />
        ICP HUB
        <br />
        {country}
      </div>
      <div className="mt-5 md:text-xl dlg:text-3xl md:font-semibold dlg:font-bold">
        {ambassadorsCount}
      </div>
      <div className="mt-2 mb-0 text-xs dlg:text-sm  font-medium max-md:mb-2.5">
        Ambassador
      </div>
      <div className="md:w-[70px] md:h-[70px] dlg:w-[90px] dlg:h-[90px] mt-3 rounded-full  flex items-center justify-center">
      <img src={`/logos/hubs/${country.toLowerCase()}.png`} alt={`Internet Computer ${country} HUB logo`} />
      </div>
    </div>
  );
}

export default HubCardReversed
