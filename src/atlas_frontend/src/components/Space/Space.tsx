import React, { useState } from "react";
import { FiFilter, FiStar } from "react-icons/fi";
import Button from "../Shared/Button.tsx";
import TaskCard from "./TaskCard/index.tsx";
import CreateNewTaskModal from "../../modals/CreateNewTaskModal.tsx";
import { useDispatch, useSelector } from "react-redux";
import { deserialize, type RootState } from "../../store/store.ts";
import { setScreenBlur } from "../../store/slices/appSlice.ts";
import { useAuth } from "@nfid/identitykit/react";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice.ts";
import type { Tasks } from "../../canisters/atlasSpace/api.ts";
import type { Principal } from "@dfinity/principal";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space.ts";
import { FaDiscord, FaLinkedinIn, FaTelegramPlane } from "react-icons/fa";
import { FaArrowLeftLong, FaXTwitter } from "react-icons/fa6";
import type { ExternalLinks } from "../../canisters/atlasSpace/types.ts";
import { getSpaceEditPath, SPACES_PATH } from "../../router/paths.ts";
import toast from "react-hot-toast";
import {
  useAuthAtlasMainActor,
  useUnAuthAtlasMainActor,
} from "../../hooks/identityKit.ts";
import { getAtlasUser, joinAtlasSpace } from "../../canisters/atlasMain/api.ts";
import TransferSpaceModal from "../../modals/TransferSpaceModal.tsx";
import { getErrorWithInfoToast } from "../../utils/errors.ts";
import { formatDuration, nowInSeconds } from "../../utils/date.ts";

interface TasksListProps {
  tasks: Tasks;
  spaceId: Principal;
}

const TasksList = ({ tasks = {}, spaceId }: TasksListProps) => {
  const now = nowInSeconds();
  const taskEntries = Object.entries(tasks).map(([id, task]) => {
    const isClosed = "refunded" in task;
    const isStarting = Number(task.start_time) > Number(now);
    const type: "expired" | "starting" | "ongoing" = isClosed ? "expired" : isStarting ? "starting" : "ongoing";
    const startingIn = type === "starting" ? formatDuration(Number(task.start_time) - Number(now)) : undefined;

    return { id, task, type, startingIn };
  });

  if (taskEntries.length === 0) return <></>;

  return (
    <>
      <div className="relative w-full bg-[#1E0F33] mb-1">
        <div className="flex px-8 py-6">
          <div className="flex gap-4">
            <Button className="flex gap-1">
              <FiFilter /> Sorting
            </Button>
            <Button className="flex gap-1">
              <FiStar /> Newest
            </Button>
          </div>
        </div>
      </div>
      
      <div className="relative w-full bg-[#1E0F33] rounded-b-xl">
        <div className="flex gap-4 md:mx-3 px-8 py-6 flex-wrap justify-between md:justify-center">
          {taskEntries.map(({ id, task, type, startingIn }) => (
            <TaskCard
              key={id}
              task={task}
              type={type}
              id={id}
              spaceId={spaceId}
              startingIn={startingIn}
            />
          ))}
        </div>
      </div>
    </>
  );
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
  const { user } = useAuth();
  const dispatch = useDispatch();
  const isScreenBlur = useSelector(
    (state: RootState) => state.app.isScreenBlur
  );
  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;
  const [isCreateTaskModal, setCreateTaskModal] = useState(false);
  const [isTransferModal, setTransferModal] = useState(false);
  const inHub = userBlockchainData?.in_hub ?? null;
  const parsedSpacePrincipal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  const authAtlasMain = useAuthAtlasMainActor();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();

  if (!parsedSpacePrincipal) return <></>;

  const didUserCanAdministrate =
    userInfo?.canAdministrate(parsedSpacePrincipal) ?? false;

  const toggleTaskModal = () => {
    setCreateTaskModal(!isCreateTaskModal);
    dispatch(setScreenBlur(!isScreenBlur));
  };
  const toggleTransferModal = () => {
    setTransferModal(!isTransferModal);
    dispatch(setScreenBlur(!isScreenBlur));
  };

  const joinSpace = async () => {
    if (!authAtlasMain || !unAuthAtlasMain || !user) {
      return;
    }
    await toast.promise(
      joinAtlasSpace({
        authAtlasMain,
        space: parsedSpacePrincipal,
      }),
      {
        loading: "Trying to join space...",
        success: "Successfully joined to space",
        error: getErrorWithInfoToast("Failed to join to space."),
      }
    );
    await getAtlasUser({
      unAuthAtlasMain,
      dispatch,
      userId: user.principal,
    });
  };

return (
    <>
      <div className="container mx-auto my-4">
        <div className="w-full px-3">
          <div className="w-full flex flex-col gap-2 md:flex-row md:flex-none md:w-auto md:gap-none my-4 ">
            <div className="flex flex-1 gap-2 justify-stretch md:justify-between">
              <Button
                light
                className="flex-1 gap-2 md:flex-none "
                onClick={() => navigate(SPACES_PATH)}
              >
                <FaArrowLeftLong /> Back
              </Button>
              {userInfo?.ownSpaces(parsedSpacePrincipal) ? (
                <Button
                  light
                  className="flex-1 md:flex-none md:justify-end md:gap-2"
                  onClick={toggleTransferModal}
                >
                  Transfer space
                </Button>
              ) : (
                <div className="hidden"></div>
              )}
            </div>
            {(didUserCanAdministrate || (!didUserCanAdministrate && userBlockchainData && !inHub)) && (
              <div className="flex flex-1 w-full gap-2 md:flex-none md:w-auto md:gap-none">
                {!didUserCanAdministrate && userBlockchainData && !inHub ? (
                  <Button className="flex-1 md:flex-none" onClick={joinSpace}>
                    Join space
                  </Button>
                ) : didUserCanAdministrate && (
                  <Button
                    light
                    className="flex-1 md:flex-none"
                    onClick={() => navigate(getSpaceEditPath(parsedSpacePrincipal))}
                  >
                    Edit space
                  </Button>
                ) }
                {didUserCanAdministrate && (
                  <Button className="flex-1 md:flex-none" onClick={toggleTaskModal}>
                    Create new task
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="relative w-full rounded-t-xl bg-[#1E0F33] mb-1">
            <div className="relative p-5 md:p-8 md:static">
              <div
                className={`${backgroundImg ? "h-52 rounded-3xl bg-center bg-no-repeat bg-cover relative" : "h-52 rounded-3xl bg-center bg-no-repeat bg-gradient-to-b from-[#9173FF] to-transparent to-[150%] bg-cover relative"} w-full flex items-center justify-center`}
                style={
                  backgroundImg
                    ? { backgroundImage: `url('${backgroundImg}')` }
                    : {}
                }
              ></div>
              <div className="flex md:mt-2 flex-col md:flex-row">
              <div className="absolute md:static left-12 transform -translate-x -translate-y-16 md:mt-8 md:gap-4 md:-translate-y-4">
                <div className="bg-white  flex rounded-3xl w-fit h-fit flex-none">
                  {avatarImg ? (
                    <img
                      src={avatarImg}
                      draggable="false"
                      className="rounded-3xl m-[3px] w-20 h-20 md:m-[5px] md:w-28 md:h-28"
                    />
                  ) : (
                    <div className="bg-[#4A0295] rounded-3xl m-[3px] w-20 h-20 md:m-[5px] md:w-28 md:h-28"></div>
                  )}
                </div>
                </div>
                <div className="mt-8 mb-2 md:mb-6 md:mt-6 md:mx-5 text-white font-montserrat min-w-0 md:flex-wrap md:my-1 flex-1">
                  <h2 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 truncate">{name}</h2>
                  <p className="bg-[#9173FF]/20 text-xs md:text-base lg:text-2xl px-2 md:px-4 py-2 rounded-xl font-medium truncate">
                    {description}
                  </p>
                </div>
                <div className="flex items-center justify-center text-white gap-2">
                  {externalLinks.discord && (
                    <a
                      href={externalLinks.discord}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button className="p-2 bg-[#9173FF]/20 rounded-xl ">
                        <FaDiscord size={36} />
                      </button>
                    </a>
                  )}
                  {externalLinks.telegram && (
                    <a
                      href={externalLinks.telegram}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button className="p-2 bg-[#9173FF]/20 rounded-xl ">
                        <FaTelegramPlane size={36} />
                      </button>
                    </a>
                  )}
                  {externalLinks.x && (
                    <a href={externalLinks.x} target="_blank" rel="noreferrer">
                      <button className="p-2 bg-[#9173FF]/20 rounded-xl ">
                        <FaXTwitter size={36} />
                      </button>
                    </a>
                  )}
                  {externalLinks.linkedIn && (
                    <a
                      href={externalLinks.linkedIn}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button className="p-2 bg-[#9173FF]/20 rounded-xl ">
                        <FaLinkedinIn size={36} />
                      </button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          <TasksList tasks={tasks} spaceId={spaceId} />
        </div>
      </div>
      {isCreateTaskModal && <CreateNewTaskModal callback={toggleTaskModal} />}
      {isTransferModal && <TransferSpaceModal callback={toggleTransferModal} />}
    </>
  );
};

export default Space;

