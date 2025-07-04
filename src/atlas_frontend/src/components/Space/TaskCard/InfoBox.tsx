import React from "react";

interface InfoBoxProps {
  type: "ongoing" | "starting" | "expired" | "points" | "steps" | "uses" | "closed";
  startingIn?: string;
  startingLabel?: string;
  points?: string;
  steps?: number;
  uses?: string;
}

const InfoBox = ({ type, startingIn, startingLabel, points, steps, uses }: InfoBoxProps) => {
  switch (type) {
    case "ongoing":
      return (
        <div className="bg-light2 p-2 text-[12px] md:text-base font-montserrat rounded text-dark w-fit">
          Ongoing
        </div>
      );
    case "starting":
      return (
        <div className="bg-background text-[12px] md:text-base p-2 font-montserrat rounded text-white w-fit">
          {startingLabel ?? (startingIn ? `Start in ${startingIn}` : "Starting soon")}
        </div>
      );
    case "expired":
      return (
        <div className="bg-classic3 text-[12px] md:text-base p-2 font-montserrat rounded text-white w-fit">
          Expired
        </div>
      );
    case "closed":
      return (
        <div className="bg-classic3 text-[12px] md:text-base p-2 font-montserrat rounded text-white w-fit">
          Closed
        </div>
      );
    case "points":
      return (
        <div className="border border-white text-[12px] md:text-base p-2 font-montserrat rounded-xl text-white w-fit">
          {points} ckUSDC
        </div>
      );
    case "steps":
      return (
        <div className="bg-white/20 border border-white text-[12px] md:text-base p-2 font-montserrat rounded-xl text-white w-fit">
          {steps} {steps === 1 ? "step" : "steps"}
        </div>
      );
    case "uses":
      return (
        <div className="bg-white/20 border border-white text-[12px] md:text-base p-2 font-montserrat rounded-xl text-white w-fit">
          {uses}
        </div>
      );
  }
};

export default InfoBox;
