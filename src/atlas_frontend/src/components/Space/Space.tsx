import React, { useEffect, useState } from "react";
import { FiFilter, FiStar } from "react-icons/fi";
import Button from "../Shared/Button.tsx";
import TaskCard from "./TaskCard/index.tsx";
import CreateNewTaskModal from "../../modals/CreateNewTaskModal.tsx";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store.ts";
import { setScreenBlur } from "../../store/slices/appSlice.ts";
import { useAuth } from "@nfid/identitykit/react";
import {
  selectUserBlockchainData,
  selectUserHub,
} from "../../store/slices/userSlice.ts";
import type { Tasks } from "../../canisters/atlasSpace/api.ts";
import type { Principal } from "@dfinity/principal";
import JoinSpaceModal from "../../modals/JoinSpaceModal.tsx";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space.ts";
import { FaDiscord, FaLinkedinIn, FaTelegramPlane } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import type { ExternalLinks } from "../../canisters/atlasSpace/types.ts";
import { getSpaceEditPath } from "../../router/paths.ts";

interface TasksListProps {
  tasks: Tasks;
  spaceId: Principal;
}

const TasksList = ({ tasks, spaceId }: TasksListProps) => {
  if (!tasks || Object.keys(tasks).length === 0) {
    return <></>;
  }

  const tasksEntries = Object.entries(tasks);

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
        <div className="flex gap-4 px-8 py-6 flex-wrap justify-center">
          {tasksEntries.map(([id, task]) => {
            return (
              <TaskCard
                key={id}
                task={task}
                type={"ongoing"}
                id={id}
                spaceId={spaceId}
              />
            );
          })}
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
  tasks?: Tasks;
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
  const userBlockchainData = useSelector(selectUserBlockchainData);
  const userInHub = useSelector(selectUserHub);
  const [isCreateTaskModal, setCreateTaskModal] = useState(false);
  const [isJoinHubModal, setJoinHubModal] = useState(false);
  const [preventBlur, setPreventBlur] = useState(false);
  const parsedSpacePrincipal = useSpaceId({
    spacePrincipal,
    navigate,
  });

  useEffect(() => {
    if (userInHub === null && !preventBlur && user) {
      setJoinHubModal(true);
      dispatch(setScreenBlur(true));
    } else {
      setJoinHubModal(false);
      dispatch(setScreenBlur(false));
    }
  }, [userInHub, isJoinHubModal, dispatch, user, preventBlur]);

  if (!parsedSpacePrincipal) return <></>;

  const toggleTaskModal = () => {
    setCreateTaskModal(!isCreateTaskModal);
    dispatch(setScreenBlur(!isScreenBlur));
  };

  const toggleJoinHubModal = () => {
    setPreventBlur(true);
    dispatch(setScreenBlur(!isScreenBlur));
    setJoinHubModal(!isJoinHubModal);
  };

  return (
    <>
      <div className="container mx-auto my-4">
        <div className="w-full px-3">
          {user && userBlockchainData?.isSpaceLead() && (
            <div className="my-4 flex justify-end gap-2">
              <a href={getSpaceEditPath(parsedSpacePrincipal)}>
                <Button light>Edit space</Button>
              </a>
              <Button onClick={toggleTaskModal}>Create new task</Button>
            </div>
          )}
          <div className="relative w-full rounded-t-xl bg-[#1E0F33] mb-1">
            <div className="p-8">
              <div
                className={`${backgroundImg ? "h-52 rounded-3xl bg-center bg-no-repeat bg-cover relative" : "bg-[#4A0295]"} w-full flex items-center justify-center`}
                style={
                  backgroundImg
                    ? { backgroundImage: `url('${backgroundImg}')` }
                    : {}
                }
              ></div>
              <div className="flex mt-8 gap-4">
                <div className="bg-white flex rounded-3xl w-fit h-fit flex-none">
                  {avatarImg ? (
                    <img
                      src={avatarImg}
                      draggable="false"
                      className="rounded-3xl m-[3px] w-20 h-20 sm:m-[5px] sm:w-28 sm:h-28"
                    />
                  ) : (
                    <div className="bg-[#4A0295] rounded-3xl m-[5px] w-28 h-28"></div>
                  )}
                </div>
                <div className="my-1 text-white font-montserrat flex-1">
                  <h2 className="text-base sm:text-4xl font-semibold flex mb-2">{name}</h2>
                  <p className="bg-[#9173FF]/20 text-xs sm:text-base px-4 py-2 rounded-xl font-medium w-full">{description}</p>
                </div>
                <div className="flex items-center justify-center text-white gap-2">
                  {externalLinks.discord && (
                    <a href={externalLinks.discord} target="_blank" rel="noreferrer">
                      <button className="p-2 bg-[#9173FF]/20 rounded-xl ">
                        <FaDiscord size={36} />
                      </button>
                    </a>
                  )}
                  {externalLinks.telegram && (
                    <a href={externalLinks.telegram} target="_blank" rel="noreferrer">
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
                    <a href={externalLinks.linkedIn} target="_blank" rel="noreferrer">
                      <button className="p-2 bg-[#9173FF]/20 rounded-xl ">
                        <FaLinkedinIn size={36} />
                      </button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          {tasks && <TasksList tasks={tasks} spaceId={spaceId} />}
        </div>
      </div>
      {isCreateTaskModal && <CreateNewTaskModal callback={toggleTaskModal} />}
      {isJoinHubModal && (
        <JoinSpaceModal
          callback={toggleJoinHubModal}
          spaceName={name}
          spacePrincipal={parsedSpacePrincipal}
        />
      )}
    </>
  );
};

export default Space;
