import React from 'react';
import type { Principal } from "@dfinity/principal";
import { useSelector } from 'react-redux';
import { deserialize} from "../../store/store";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice";
import { useSpaceId } from '../../hooks/space';
import { useNavigate, useParams } from 'react-router-dom';


interface SpaceInfoBarProps {
  userInfo?: BlockchainUser | null;
  spacePrincipal?: Principal | null;
}

const SpaceInfoBar = ({ userInfo, spacePrincipal }: SpaceInfoBarProps) => {
  const { spacePrincipal: paramSpacePrincipal } = useParams();
  const navigate = useNavigate();

  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );

  const currentUserInfo = userInfo || (userBlockchainData
      ? new BlockchainUser(userBlockchainData)
      : null);
  const inHub = currentUserInfo?.in_hub ?? null;
  const parsedSpacePrincipal = spacePrincipal || useSpaceId({
    spacePrincipal: paramSpacePrincipal,
    navigate,
  });
  const isUserInDifferentHub = currentUserInfo?.in_hub && 
  parsedSpacePrincipal?.toString() !== currentUserInfo?.in_hub.id.toString();
  if (!parsedSpacePrincipal) return <></>;

  const isSpaceLead = currentUserInfo?.isSpaceLead() ?? false;

  const didUserCanAdministrate =
    currentUserInfo?.canAdministrate(parsedSpacePrincipal) ?? false;

  return (
    didUserCanAdministrate || isSpaceLead ? (
        null
    ) : inHub === null && currentUserInfo != null ? (
        <div className="text-sm sm:text-base text-light font-montserrat font-medium bg-background px-4 sm:px-12 mt-6 py-3 sm:py-4">
            <h2>Join this space to start working on tasks.</h2>
        </div>
    ) : currentUserInfo === null ? (
        <div className="text-sm sm:text-base text-light font-montserrat font-medium bg-background px-4 sm:px-12 mt-6 py-3 sm:py-4">
            <h2>Create an account to continue.</h2>
        </div>
    ) : isUserInDifferentHub ? (
        <div className="text-sm sm:text-base text-light font-montserrat font-medium bg-background px-4 sm:px-12 mt-6 py-3 sm:py-4">
            <h2>You cannot perform tasks in a different hub.</h2>
        </div>
    ) : null
  );
};

export default SpaceInfoBar;
