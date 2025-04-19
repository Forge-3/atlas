import React from "react";

interface InfoBoxArgs {
  type: "ongoing" | "starting" | "expired" | "points" | "tokens";
  startingIn?: string;
  points?: string;
  tokens?: string
}

const InfoBox = ({ type, startingIn, points, tokens }: InfoBoxArgs) => {
  switch (type) {
    case "ongoing":
      return (
        <div className="bg-[#4A0295] border border-white p-2 font-montserrat text-sm rounded-xl text-white w-fit">
          Ongoing
        </div>
      );
    case "starting":
      return (
        <div className="bg-[#8326E3] border border-white p-2 font-montserrat text-sm rounded-xl text-white w-fit">
          Start in {startingIn}
        </div>
      );
    case "expired":
      return (
        <div className="bg-[#9173FF]/20 border border-white p-2 font-montserrat text-sm rounded-xl text-white w-fit">
          Expired
        </div>
      );
    case "points":
      return (
        <div className="border border-white p-2 font-montserrat text-sm rounded-xl text-white w-fit">
          {points} Points
        </div>
      );
    case "tokens":
      return (
        <div className="bg-[#fff]/20 border border-white p-2 font-montserrat text-sm rounded-xl text-white w-fit">
          {tokens}
        </div>
      );
  }
};

export default InfoBox;
