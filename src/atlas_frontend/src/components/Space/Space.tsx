import React, { useEffect, useMemo, useState } from "react";
import Button from "../Shared/Button.tsx";
import SpaceHeader from "../Shared/SpaceHeader.tsx";
import TaskCard from "./TaskCard/index.tsx";
import { useDispatch, useSelector } from "react-redux";
import { deserialize, type RootState } from "../../store/store.ts";
import { setScreenBlur } from "../../store/slices/appSlice.ts";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice.ts";
import type { Tasks } from "../../canisters/atlasSpace/api.ts";
import type { Principal } from "@dfinity/principal";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space.ts";
import type { ExternalLinks } from "../../canisters/atlasSpace/types.ts";
import { getSpaceEditPath, getCreateTaskPath } from "../../router/paths.ts";
import TransferSpaceModal from "../../modals/TransferSpaceModal.tsx";
import { nowInSeconds } from "../../utils/date.ts";
import LocalBlurOverlay from "../Shared/LocalBlurOverlay.tsx";
import { getStartingIn, getTaskType } from "../../utils/tasks.ts";
import { AiFillStar } from "react-icons/ai";
import { RiAddLine, RiExchangeLine, RiSortDesc, RiArrowDownSFill } from "react-icons/ri";
import { FiEdit2 } from "react-icons/fi";

type SortMode = "newest" | "sorting" | "sorting-reverse";

const STATUS_ORDER = {
  ongoing: 0,
  starting: 1,
  expired: 2,
  closed: 2,
} as const;

type TaskStatus = keyof typeof STATUS_ORDER;

type SortMeta = { start: number; startsIn: number; type: TaskStatus };

type TimeLike = number | string | bigint;
const toSeconds = (v: TimeLike): number => {
  if (typeof v === "bigint") return Number(v);
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return 0;
  if (n > 1e18) return Math.floor(n / 1_000_000_000);
  if (n > 1e12) return Math.floor(n / 1000);
  return Math.floor(n);
};

const hasStartTime = (t: unknown): t is { start_time: TimeLike } => {
  if (!t || typeof t !== "object") return false;
  const obj = t as Record<string, unknown>;
  return "start_time" in obj && obj.start_time != null;
};

interface SpaceProps {
  name: string;
  description: string;
  avatarImg: string | null;
  backgroundImg: string | null;
  tasks: Tasks;
  spaceId: Principal;
  externalLinks: ExternalLinks;
}

interface TasksListProps {
  tasks?: Tasks;
  spaceId: Principal;
  sortBy: SortMode;
}

const TasksList = ({ tasks = {}, spaceId, sortBy }: TasksListProps) => {
  const [time, setTime] = useState(nowInSeconds());

  useEffect(() => {
    const i = setInterval(() => setTime(nowInSeconds()), 2000);
    return () => clearInterval(i);
  }, []);

  const taskIds = useMemo(
    () =>
      Object.entries(tasks ?? {})
        .filter(([, t]) => hasStartTime(t))
        .map(([id]) => id),
    [tasks]
  );

  const computeTaskMeta = (taskId: string): SortMeta => {
  const t = tasks[taskId];
  if (!hasStartTime(t)) {
    return { start: 0, startsIn: Number.POSITIVE_INFINITY, type: "expired" };
  }
  const startSec = toSeconds(t.start_time);
  const status = getTaskType(t, time) as TaskStatus;
  return { start: startSec, startsIn: startSec - time, type: status };
  };

  const getMeta = (taskId: string): SortMeta => computeTaskMeta(taskId);


  const compareByStartTime = (
    leftId: string,
    rightId: string,
    direction: "asc" | "desc" = "asc"
  ) => {
    const left = getMeta(leftId);
    const right = getMeta(rightId);
    const diff = right.start - left.start;
    return direction === "asc" ? -diff : diff;
  };

const compareByStartDesc = (leftId: string, rightId: string) =>
  compareByStartTime(leftId, rightId, "desc");

const parseId = (id: string): bigint => {
  try { return BigInt(id); } catch { return 0n; }
};

const compareByCreatedDesc = (leftId: string, rightId: string) => {
  const l = parseId(leftId);
  const r = parseId(rightId);
  if (r > l) return 1;
  if (r < l) return -1;
  return compareByStartDesc(leftId, rightId);
};

const makeCompareByStatus = (direction: "asc" | "desc") =>
  (leftId: string, rightId: string) => {
    const left = getMeta(leftId);
    const right = getMeta(rightId);

    const rawStatusDiff = STATUS_ORDER[left.type] - STATUS_ORDER[right.type];
    const statusDiff = direction === "asc" ? rawStatusDiff : -rawStatusDiff;
    if (statusDiff !== 0) return statusDiff;

    if (left.type === "starting" && right.type === "starting") {
      const rawDelta = left.startsIn - right.startsIn;
      return direction === "asc" ? rawDelta : -rawDelta;
    }

    return compareByStartTime(leftId, rightId, direction);
  };


  const comparator =
  sortBy === "newest"
    ? compareByCreatedDesc
    : sortBy === "sorting"
    ? makeCompareByStatus("asc")
    : makeCompareByStatus("desc");

  const sortedIds = useMemo(() => {
    const ids = [...taskIds];
    ids.sort(comparator);
    return ids;
  }, [taskIds, sortBy, time]);

  if (!sortedIds.length) return null;

  return (
    <div className="relative w-full rounded-b-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10 px-10 py-6">
        <LocalBlurOverlay isLoading={!tasks} />
        {sortedIds.map((taskId) => {
          const task = tasks[taskId];
          const { type } = getMeta(taskId);
          return (
            <TaskCard
              key={taskId}
              id={taskId}
              task={task}
              type={type}
              spaceId={spaceId}
              startingIn={getStartingIn(task, time, type)}
              time={time}
            />
          );
        })}
      </div>
    </div>
  );
};

const Space = ({
  name,
  description,
  backgroundImg,
  avatarImg,
  tasks,
  spaceId,
  externalLinks,
}: SpaceProps) => {
  const navigate = useNavigate();
  const { spacePrincipal } = useParams();
  const dispatch = useDispatch();
  const isScreenBlur = useSelector(
    (state: RootState) => state.app.isScreenBlur);
  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
   ? new BlockchainUser(userBlockchainData)
  : null;
  const [isTransferModal, setTransferModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>("sorting");
  const inHub = userBlockchainData?.in_hub ?? null;
  const parsedSpacePrincipal = useSpaceId({ spacePrincipal, navigate });
  const [isActionsOpen, setActionsOpen] = useState(false);

  if (!parsedSpacePrincipal) return <></>;

  const didUserCanAdministrate = userInfo?.canAdministrate(parsedSpacePrincipal) ?? false;
  const isSpaceLead = userInfo?.isSpaceLead() ?? false;

  const toggleTransferModal = () => {
    setTransferModal(!isTransferModal);
    dispatch(setScreenBlur(!isScreenBlur));
  };

  const toggleSortOrder = () => {
    setSortBy((prev) => {
      if (prev === "sorting") return "sorting-reverse";
      if (prev === "sorting-reverse") return "sorting";
      return "sorting";
    });
  };

  const isAsc = sortBy === "sorting";
  const isDesc = sortBy === "sorting-reverse";

  return (
    <>
      <div className={`w-full ${didUserCanAdministrate || isSpaceLead ? 'bg-background' : 'bg-dark'} flex`}>
        <div className="w-full min-h-screen">
          <SpaceHeader
            spaceName={name}
            spaceDescription={description}
            spaceLogo={avatarImg}
            spaceBackground={backgroundImg}
            externalLinks={externalLinks}
            userInfo={userInfo}
            spacePrincipal={parsedSpacePrincipal}
          />

          <div className="w-full h-[1px] bg-primary" />
          <div className="flex flex-1">
            <div className="flex gap-3 mx-4 md:mx-10 my-4">
            <Button
              variant={isAsc || isDesc ? "primary" : "publish"}
              className="flex gap-1 py-1 md:py-2 px-4 text-[12px] md:text-base font-montserrat font-medium"
              onClick={toggleSortOrder}
            >
              <RiSortDesc
                className={[
                  "h-3 w-3 md:h-6 md:w-6",
                  "transform transition-transform duration-200",
                  isAsc ? "rotate-0" : isDesc ? "-rotate-180" : "rotate-0 opacity-60"
                ].join(" ")}
              />
              Sorting
            </Button>
            <Button
              variant={sortBy === "newest" ? "primary" : "publish"}
              className="flex gap-1 py-1 md:py-2 px-4 text-[12px] md:text-base font-montserrat font-medium"
              onClick={() => setSortBy("newest")}
            >
              <AiFillStar className="h-3 w-3 md:h-6 md:w-6" /> Newest
            </Button>
            </div>
            <div className="flex flex-1 justify-end mx-4 md:mx-10 my-4">
            <div className="hidden lg:flex gap-2">
              {userInfo?.ownSpaces(parsedSpacePrincipal) ? (
                <Button
                  variant="primary"
                  className="flex-1 md:flex-none px-3 py-1 font-montserrat font-medium md:justify-end md:gap-2"
                  onClick={toggleTransferModal}
                >
                  <RiExchangeLine className="h-6 w-6 shrink-0" />
                  Transfer space
                </Button>
              ) : (
                <div className="hidden"></div>
              )}
              {(didUserCanAdministrate ||
                (!didUserCanAdministrate && userBlockchainData && !inHub)) && (
                <div className="flex gap-2">
                  {didUserCanAdministrate && userBlockchainData && !inHub && (
                    <Button
                      variant="primary"
                      className="flex-1 px-3 py-1 gap-2 md:flex-none font-montserrat font-medium"
                      onClick={() => navigate(getSpaceEditPath(parsedSpacePrincipal))}
                    >
                      <FiEdit2 className="h-5 w-6 shrink-0" />
                      Edit space
                    </Button>
                  )}
                  {didUserCanAdministrate && (
                    <Button
                      className="flex-1 md:flex-none px-3 py-1 gap-2 font-montserrat font-medium"
                      onClick={() => navigate(getCreateTaskPath(parsedSpacePrincipal))}
                    >
                      <RiAddLine className="h-6 w-6 shrink-0" />
                      Create new task
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="relative lg:hidden">
              <Button
                variant="primary"
                className="px-3 py-1 font-montserrat font-medium flex items-center gap-1 text-[12px] md:text-base"
                onClick={() => setActionsOpen((v) => !v)}
              >
                Manage
                <span
                  className={`inline-block transition-transform duration-200 ${isActionsOpen ? "rotate-180" : "rotate-0"}`}
                >
                  <RiArrowDownSFill className="h-6 w-6 shrink-0" />
                </span>
              </Button>
              {isActionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActionsOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 text-white w-48 md:w-96 rounded-md bg-dark/60 backdrop-blur-2xl"
                  >
                    {userInfo?.ownSpaces(parsedSpacePrincipal) && (
                      <button
                      role="menuitem"
                      className="w-full text-left px-3 py-2 md:text-2xl rounded-md font-montserrat flex items-center gap-2"
                      onClick={() => { setActionsOpen(false); toggleTransferModal(); }}
                    >
                      <RiExchangeLine className="h-5 w-5 md:h-7 md:w-7 shrink-0" />
                      Transfer space
                    </button>
                    )}
                    <div className="h-[1px] bg-light" role="none"></div>
                    {(didUserCanAdministrate ||
                      (!didUserCanAdministrate && userBlockchainData && !inHub)) && (
                      <>
                        {didUserCanAdministrate && userBlockchainData && !inHub && (
                          <button
                            role="menuitem"
                            className="w-full text-left px-3 py-2 md:text-2xl rounded-md flex items-center gap-2 font-montserrat"
                            onClick={() => { setActionsOpen(false); navigate(getSpaceEditPath(parsedSpacePrincipal)); }}
                          >
                            <FiEdit2 className="h-4 w-5 md:h-6 md:w-7 shrink-0" />
                            Edit space
                          </button>
                        )}
                        <div className="w-full h-[1px] bg-light" role="none"></div>
                        {didUserCanAdministrate && (
                          <button
                            role="menuitem"
                            className="w-full text-left px-3 py-2 md:text-2xl rounded-md flex items-center gap-2 font-montserrat"
                            onClick={() => { setActionsOpen(false); navigate(getCreateTaskPath(parsedSpacePrincipal)); }}
                          >
                            <RiAddLine className="h-5 w-5 md:h-7 md:w-7 shrink-0" />
                            Create new task
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          </div>

          <div className="w-full h-[1px] bg-primary mb-2" />

          <TasksList tasks={tasks} spaceId={spaceId} sortBy={sortBy} />
        </div>
      </div>
      {isTransferModal && <TransferSpaceModal callback={toggleTransferModal} />}
    </>
  );
};

export default Space;

