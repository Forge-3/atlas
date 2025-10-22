import React from "react";
import InfoBox from "./InfoBox.tsx";
import { useNavigate } from "react-router-dom";
import { formatUnits } from "ethers";
import { DECIMALS } from "../../../canisters/ckUsdcLedger/constans.ts";
import type { Principal } from "@dfinity/principal";
import { getTaskPath } from "../../../router/paths.ts";
import type { AnyTask } from "../../../canisters/atlasSpace/api.ts";

interface TaskCardProps {
  type: "closed" | "expired" | "starting" | "ongoing";
  startingIn?: string;
  id: string,
  task: AnyTask,
  spaceId: Principal,
  time: number
}

const TaskCard = ({ startingIn, task, id, type, spaceId}: TaskCardProps) => {
  const navigate = useNavigate();

  const reward = formatUnits(task.token_reward.CkUsdc.amount, DECIMALS)
  const rewarded = task.rewarded.length;

  return (
    <div className="w-full h-auto">
    <a className="flex flex-col" onClick={() => navigate(getTaskPath(spaceId, id))}>
      <div
        className={`h-52 p-4 rounded-t-xl ${
          type === "ongoing" && "bg-primary"
        } ${type === "starting" && "bg-primary"} ${
          (type === "expired" || type === "closed") && "bg-black"
        }`}
      >
        <InfoBox type={type} startingIn={startingIn} />
      </div>
      <div
      className={`text-white rounded-b-xl font-montserrat font-medium p-4 flex flex-col gap-2 h-44`}
      style={
        type === "ongoing"
          ? { backgroundImage: 'linear-gradient(to bottom, var(--color-background) 0%, var(--color-primary) 100%)' }
          : type === "starting"
          ? { backgroundImage: 'linear-gradient(to bottom, var(--color-dark) 0%, var(--color-background) 100%)' }
          : (type === "expired" || type === "closed")
          ? { backgroundImage: 'linear-gradient(to bottom, var(--color-classic3) 0%, var(--color-classic3) 40%, var(--color-classic2) 130%)' }
          : {}
      }>
        <h3 className="break-words text-2xl my-5">{task.task_title}</h3>
        <div className="flex mt-auto gap-2 ">
          <InfoBox
            type="points"
            points={reward}
          />
          <InfoBox type="steps" steps={task.tasks.length} />
          <InfoBox type="uses" uses={`${rewarded}/${task.number_of_uses}`} />
        </div>
      </div>
    </a>
    </div>
  );
};

export default TaskCard;
