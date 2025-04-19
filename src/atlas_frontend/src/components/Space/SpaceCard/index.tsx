import React from "react";
import InfoBox from "./InfoBox.tsx";

interface SpaceCardArgs {
  type: "ongoing" | "starting" | "expired";
  startingIn?: string;
  points: string;
  tokens: string;
}

const SpaceCard = ({ type, startingIn, points, tokens }: SpaceCardArgs) => {
  return (
    <div className="rounded-xl bg-gradient-to-b from-[#9173FF] to-transparent to-[150%] flex flex-col">
      <div
        className={`h-40 p-4 rounded-t-xl ${type === "ongoing" && "bg-[#9173FF]/20"} ${type === "starting" && "bg-[#4A0295]"} ${type === "expired" && "bg-[#202020]"}`}
      >
        <InfoBox type={type} startingIn={startingIn} />
      </div>
      <div className="text-white font-montserrat font-medium p-6 flex flex-col gap-2">
        <h3 className="text-2xl">Do task to redeem rewards</h3>
        <div className="flex justify-end gap-2">
          {points && <InfoBox type="points" points={points} />}
          {tokens && <InfoBox type="tokens" tokens={tokens} />}
        </div>
      </div>
    </div>
  );
};

export default SpaceCard;
