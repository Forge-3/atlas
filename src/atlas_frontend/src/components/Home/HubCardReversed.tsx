import React from "react";

interface HubCardReversedProps {
  ambassadorsCount: number;
  country: string;
}

const HubCardReversed = ({
  ambassadorsCount,
  country,
}: HubCardReversedProps) => {
  return (
    <div
      className="flex flex-col items-center border rounded-t-xl rounded-b-full border-2 border-white border-solid gap-4 font-montserrat max-w-[180px]"
      style={{
        borderTopLeftRadius: "0.75rem",
        borderTopRightRadius: "0.75rem",
        borderBottomLeftRadius: "4rem",
        borderBottomRightRadius: "4rem",
      }}
    >
      <div className="px-2 py-3 font-medium border-b-2 border-white self-stretch font-semibold rounded-b-xl">
        Join
        <br />
        ICP HUB
        <br />
        {country}
      </div>
      <div>
        <div className="text-3xl font-semibold">{ambassadorsCount}</div>
        <div className="text-xs font-medium">Ambassador</div>
      </div>
      <div className="w-[94px] h-[94px] rounded-full flex items-center justify-center">
        <img
          src={`/hubs/logo-${country.toLowerCase()}-square.jpg`}
          alt={`Internet Computer ${country} HUB logo`}
          draggable="false"
          className="rounded-full"
        />
      </div>
    </div>
  );
};

export default HubCardReversed;
