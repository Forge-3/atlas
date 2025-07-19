import * as React from "react";
import HubCard from "./HubCard.tsx";
import HubCardReversed from "./HubCardReversed.tsx";

const HubCards = () => {
  const data: {
    ChampionsCount: number;
    country: string;
  }[] = [
    { ChampionsCount: 74, country: "Argentina" },
    { ChampionsCount: 14, country: "Egypt" },
    { ChampionsCount: 43, country: "Mexico" },
    { ChampionsCount: 122, country: "Poland" },
    { ChampionsCount: 42, country: "Turkey" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-x-9 sm:gap-x-12 gap-y-8 w-full mt-7 sm:mt-12 text-xs leading-none text-center text-white">
      {data.map((hubData, idx) => (
        <div
          key={idx}
          className="flex-shrink-0 flex-grow-0 basis-[calc(33.33%-1.3333rem) sm:basis-full max-w-20 flex justify-center"
        >
          {idx % 2 === 0 ? (
            <HubCard {...hubData} />
          ) : (
            <HubCardReversed {...hubData} />
          )}
        </div>
      ))}
    </div>
  );
};

export default HubCards