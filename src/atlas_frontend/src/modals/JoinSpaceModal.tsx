import React from "react";
import Button from "../components/Shared/Button";
import { useNavigate } from "react-router-dom";
import { SPACES_PATH } from "../router/paths";
import {
  
  getAtlasUser,
  joinAtlasSpace,
} from "../canisters/atlasMain/api";
import type { Principal } from "@dfinity/principal";
import {
  useAuthAtlasMainActor,
  useUnAuthAtlasMainActor,
} from "../hooks/identityKit";
import { useDispatch } from "react-redux";
import { useAuth } from "@nfid/identitykit/react";
import toast from "react-hot-toast";

interface JoinSpaceModalArgs {
  callback: () => void;
  spaceName: string;
  spacePrincipal: Principal;
}

const JoinSpaceModal = ({
  callback,
  spaceName,
  spacePrincipal,
}: JoinSpaceModalArgs) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const goToSpaces = () => {
    callback();
    navigate(SPACES_PATH);
  };
  const authAtlasMain = useAuthAtlasMainActor();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();

  const joinSpace = async () => {
    if (!authAtlasMain || !unAuthAtlasMain || !user) {

      return;
    }
    await toast.promise(joinAtlasSpace({
      authAtlasMain,
      space: spacePrincipal,
    }),
  {
    loading: "Trying to join space...",
    success: "Succesfully joined to space",
    error: "Failed to join to space",
  });
    getAtlasUser({
      unAuthAtlasMain,
      dispatch,
      userId: user.principal,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={callback}
    >
      <div
        className="flex flex-col rounded-xl bg-white p-[20px] gap-[10px] w-[40rem]"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <h2 className="flex items-center justify-between font-semibold font-montserrat">
          Join {spaceName}
        </h2>
        <p className="mb-6 text-gray-600">
          Join {spaceName} and earn rewards by completing tasks. (You cannot
          change your space after joining)
        </p>
        <Button className="w-full" onClick={joinSpace}>
          Join
        </Button>
        <Button
          className="w-full !bg-[#1E0F33]/30"
          light={true}
          onClick={goToSpaces}
        >
          See other spaces
        </Button>
      </div>
    </div>
  );
};

export default JoinSpaceModal;
