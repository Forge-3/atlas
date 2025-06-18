import React, { useEffect, useState } from "react";
import { FiFilter, FiStar } from "react-icons/fi";
import Button from "../Shared/Button.tsx";
import TaskCard from "./TaskCard/index.tsx";
import CreateNewTaskModal from "../../modals/CreateNewTaskModal.tsx";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store.ts";
import { setScreenBlur } from "../../store/slices/appSlice.ts";
import { useAuth } from "@nfid/identitykit/react";
import { selectUserBlockchainData, selectUserHub } from "../../store/slices/userSlice.ts";
import type { Tasks } from "../../canisters/atlasSpace/api.ts";
import type { Principal } from "@dfinity/principal";
import JoinSpaceModal from "../../modals/JoinSpaceModal.tsx";
import { useNavigate, useParams } from "react-router-dom";
import { useSpaceId } from "../../hooks/space.ts";

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
}

const Space = ({
  name,
  description,
  backgroundImg,
  avatarImg,
  tasks,
  spaceId,
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
  const principal = useSpaceId({
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

  if (!principal) return <></>;

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
            <div className="mb-2 flex justify-end">
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
              >
              </div>
              <div className="flex mt-8">
                <div className="bg-white flex rounded-3xl w-fit h-fit flex-none">
                  {avatarImg ? (
                    <img
                      src={avatarImg}
                      draggable="false"
                      className="rounded-3xl m-[5px] w-28 h-28"
                    />
                  ) : (
                    <div className="bg-[#4A0295] rounded-3xl m-[5px] w-28 h-28"></div>
                  )}
                </div>
                <div className="ml-4 my-1 text-white font-montserrat flex-1">
                  <h2 className="text-4xl font-semibold flex">{name}</h2>
                  <p>{description}</p>
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
          spacePrincipal={principal}
        />
      )}
    </>
  );
};

export default Space;
