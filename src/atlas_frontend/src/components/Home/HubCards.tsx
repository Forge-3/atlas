import * as React from "react";
import HubCard from "./HubCard.tsx";
import HubCardReversed from "./HubCardReversed.tsx";

const HubCards = () => {
  const data: {
    ambassadorsCount: number;
    country: string;
  }[] = [
    { ambassadorsCount: 74, country: "Argentina" },
    { ambassadorsCount: 14, country: "Egypt" },
    { ambassadorsCount: 43, country: "Mexico" },
    { ambassadorsCount: 122, country: "Poland" },
    { ambassadorsCount: 42, country: "Turkey" },
  ];

  return (
    <div className="flex flex-wrap w-full mt-12 items-center justify-center text-xs leading-none text-center text-white">
      <div className="flex justify-center flex-wrap gap-5">
        {data.map((hubData, idx) => (
          <div key={idx} className="flex gap-3">
            {idx % 2 === 0 ? (
              <HubCard {...hubData} />
            ) : (
              <HubCardReversed {...hubData} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HubCards