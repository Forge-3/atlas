import React from "react";
import Button from "../components/Shared/Button";
import { useNavigate } from "react-router-dom";
import { SPACES_PATH } from "../router/paths";
import type { Principal } from "@dfinity/principal";
import useJoinSpace from "../hooks/useJoinSpace";

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

  const goToSpaces = () => {
    callback();
    navigate(SPACES_PATH);
  };

  const joinSpace = useJoinSpace(spacePrincipal).joinSpace;

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
          className="w-full !bg-darker/30"
          variant="primary"
          onClick={goToSpaces}
        >
          See other spaces
        </Button>
      </div>
    </div>
  );
};

export default JoinSpaceModal;
