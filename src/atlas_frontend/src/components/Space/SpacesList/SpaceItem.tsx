import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getSpacePath } from "../../../router/paths";
import { Principal } from "@dfinity/principal";
import Button from "../../Shared/Button";
import { RiAddLine } from "react-icons/ri";
import { deserialize } from "../../../store/store";
import { BlockchainUser, selectUserBlockchainData, type StorableUser } from "../../../store/slices/userSlice";
import useJoinSpace from "../../../hooks/useJoinSpace";
import { useSelector } from "react-redux";

interface SpaceItemProps {
  name: string;
  description: string;
  avatarImg: string | null;
  backgroundImg: string | null;
  spacePrincipal: Principal;
}

const SpaceItem = ({
  name,
  description,
  avatarImg,
  spacePrincipal,
}: SpaceItemProps) => {
  const navigate = useNavigate();

  const userBlockchainData = deserialize<StorableUser>(
      useSelector(selectUserBlockchainData)
  );
  const inHub = userBlockchainData?.in_hub ?? null;
  const isUserInHub = inHub?.id.toString() === spacePrincipal.toString();
  const isUserInDifferentHub = inHub && inHub.id.toString() !== spacePrincipal.toString();

  const userInfo = userBlockchainData
      ? new BlockchainUser(userBlockchainData)
      : null;

  const didUserCanAdministrate =
    userInfo?.canAdministrate(spacePrincipal) ?? false;

  const joinSpace = useJoinSpace(spacePrincipal).joinSpace;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}>
      <div className="flex flex-row w-full my-3">
        <div className="flex flex-col">
          {avatarImg ? (
            <img
              src={avatarImg}
              draggable="false"
              className="rounded-md mb-2 w-20 h-20 sm:w-32 sm:h-28"
              onClick={() => navigate(getSpacePath(spacePrincipal))}
            />
          ) : (
            <div
              className="bg-deep-purple rounded-md mb-2 w-20 h-20 sm:w-28 sm:h-28"
              onClick={() => navigate(getSpacePath(spacePrincipal))}
            />
          )}

          {didUserCanAdministrate ? (
            <span className="px-4 py-1 text-[12px] bg-dark/15 rounded md:text-base text-center font-montserrat font-medium text-white">
              Owner
            </span>
          ) : isUserInHub ? (
            <span className="px-4 py-1 text-[12px] bg-primary rounded md:text-base text-center font-montserrat font-medium text-white">
              Joined
            </span>
          ) : isUserInDifferentHub ? (
            <span className="px-4 py-1 text-[12px] bg-dark/15 rounded md:text-base text-center font-montserrat font-medium text-white/60">
              {`Can't join`}
            </span>
          ) : (
            <Button
              variant="primary"
              className="px-4 text-[12px] md:text-base font-medium text-white"
              onClick={joinSpace}>
              Join <RiAddLine className="text-base md:text-xl" />
            </Button>
          )}
        </div>
        <div
          className="flex flex-col ml-3 w-full"
          onClick={() => navigate(getSpacePath(spacePrincipal))}
        >
          <h2 className="text-light font-montserrat font-semibold text-[22px] md:text-h2 mb-2">
            {name}
          </h2>
          <h3 className="text-light font-montserrat md:text-h3 mb-2">
          {/* TODO: Add a new `creationDate` field in the backend for missions. 
              Send this value when creating a mission, fetch it on the frontend, and display it. */}     
           {description}
          </h3>
          <h3 className="flex text-light h-full rounded p-3 items-center font-montserrat text-base sm:text-h3 bg-background w-full">
            {description}
          </h3>
        </div>
        
      </div>
      
    </motion.div>
  );
};

export default SpaceItem;


