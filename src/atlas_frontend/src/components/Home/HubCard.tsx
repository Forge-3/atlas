import React from "react";

function AmbassadorCard({ ambassadorsCount, country }: { ambassadorsCount: number, country: string  }) {
  return (
    <div className="flex w-full flex-col items-center  border border-white border-solid  rounded-t-full ">
      <div className="md:w-[70px] md:h-[70px] dlg:w-[90px] dlg:h-[90px] mb-3 rounded-full  flex items-center justify-center">
        <img src={`/logos/hubs/${country.toLowerCase()}.png`} alt={`Internet Computer ${country} HUB logo`} />
      </div>
      <div className="md:text-xl dlg:text-3xl md:font-semibold dlg:font-bold">
        {ambassadorsCount}
      </div>
      <div className="mt-2 text-xs dlg:text-sm md:font-normal dlg:font-medium">
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
