import React from "react";

interface InfoBoxProps {
  type: "ongoing" | "starting" | "expired" | "points" | "steps" | "uses";
  startingIn?: string;
  points?: string;
  steps?: number;
  uses?: string;
}

const InfoBox = ({ type, startingIn, points, steps, uses }: InfoBoxProps) => {
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
          {points} XP
        </div>
      );
    case "steps":
      return (
        <div className="bg-[#fff]/20 border border-white p-2 font-montserrat text-sm rounded-xl text-white w-fit">
          {steps} {steps === 1 ? "step" : "steps"}
        </div>
      );
    case "uses":
      return (
        <div className="bg-[#fff]/20 border border-white p-2 font-montserrat text-sm rounded-xl text-white w-fit">
          {uses}
        </div>
      );
  }
};

export default InfoBox;
