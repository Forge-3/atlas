import React from "react";

interface AmbassadorCardProps {
  ambassadorsCount: number;
  country: string;
}

function AmbassadorCard({ ambassadorsCount, country }: AmbassadorCardProps) {
  return (
    <div
      className="flex flex-col justify-items-center border-2 border-white border-solid gap-4 font-montserrat max-w-[180px]"
      style={{
        borderTopLeftRadius: "4rem",
        borderTopRightRadius: "4rem",
        borderBottomLeftRadius: "0.75rem",
        borderBottomRightRadius: "0.75rem",
      }}
    >
      <div className="w-[94px] h-[94px] rounded-full flex items-center justify-center">
        <img
          src={`/hubs/logo-${country.toLowerCase()}-square.jpg`}
          alt={`Internet Computer ${country} HUB logo`}
          draggable="false"
          className="rounded-full"
        />
      </div>
      <div>
        <div className="text-3xl font-semibold">{ambassadorsCount}</div>
        <div className="text-xs font-medium">Ambassador</div>
      </div>
      <div className="px-2 py-3 font-medium border-t-2 border-white self-stretch rounded-xl font-semibold">
        Join
        <br />
        ICP HUB <br />
        {country}
      </div>
    </div>
  );
}

export default AmbassadorCard;
