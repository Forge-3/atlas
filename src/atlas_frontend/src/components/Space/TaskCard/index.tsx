import React from "react";
import InfoBox from "./InfoBox.tsx";
import type { Task } from "../../../../../declarations/atlas_space/atlas_space.did";
import { useNavigate } from "react-router-dom";
import { formatUnits } from "ethers";
import { DECIMALS } from "../../../canisters/ckUsdcLedger/constans.ts";
import type { Principal } from "@dfinity/principal";
import { getTaskPath } from "../../../router/paths.ts";

interface TaskCardProps {
  type: "ongoing" | "starting" | "expired";
  startingIn?: string;
  id: string,
  task: Task;
  spaceId: Principal
}

const TaskCard = ({ startingIn, task, id, type, spaceId}: TaskCardProps) => {
  const navigate = useNavigate();

  const reward = formatUnits(task.token_reward.CkUsdc.amount, DECIMALS)
  const lastTask = task.tasks.at(-1)?.GenericTask.submission.filter(([, submission]) => 'Accepted' in submission.state)

  return (
    <div className="w-[20rem]">
    <a className="rounded-xl bg-gradient-to-b from-[#9173FF] to-transparent to-[150%] flex flex-col" onClick={() => navigate(getTaskPath(spaceId, id))}>
      <div
        className={`h-40 p-4 rounded-t-xl ${
          type === "ongoing" && "bg-[#9173FF]/20"
        } ${type === "starting" && "bg-[#4A0295]"} ${
          type === "expired" && "bg-[#202020]"
        }`}
      >
        <InfoBox type={type} startingIn={startingIn} />
      </div>
      <div className="text-white font-montserrat font-medium p-6 flex flex-col gap-2">
        <h3 className="text-2xl">{task.task_title}</h3>
        <div className="flex justify-end gap-2">
          <InfoBox
            type="points"
            points={reward}
          />
          <InfoBox type="steps" steps={task.tasks.length} />
          {/* //TODO: fix count of submission */}
          <InfoBox type="uses" uses={`${lastTask?.length}/${task.number_of_uses}`} />
        </div>
      </div>
    </a>
    </div>
  );
};

export default TaskCard;
