import React from 'react';
import { FaDiscord, FaLinkedin, FaTelegram, FaXTwitter } from "react-icons/fa6";
import type { ExternalLinks } from "../../canisters/atlasSpace/types";
import type { Principal } from "@dfinity/principal";
import useJoinSpace from '../../hooks/useJoinSpace';
import { useSelector } from 'react-redux';
import { deserialize} from "../../store/store";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice";
import { useSpaceId } from '../../hooks/space';
import { useNavigate, useParams } from 'react-router-dom';


interface SpaceExternalLinksProps {
  externalLinks?: ExternalLinks | null;
  userInfo?: BlockchainUser | null;
  spacePrincipal?: Principal | null;
}

const SpaceExternalLinks = ({ externalLinks, userInfo, spacePrincipal }: SpaceExternalLinksProps) => {
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
  if (!parsedSpacePrincipal) return <></>;
  const joinSpace = useJoinSpace(parsedSpacePrincipal).joinSpace;
  if (!externalLinks) return null;

  const didUserCanAdministrate =
    currentUserInfo?.canAdministrate(parsedSpacePrincipal) ?? false;

  const isAdmin = currentUserInfo && parsedSpacePrincipal && currentUserInfo.canAdministrate(parsedSpacePrincipal) || userInfo?.isSpaceLead?.();
  const variant = isAdmin ? 'bright' : 'default';

  const iconBtnBg =
    variant === 'bright' ? 'bg-dark/20' : 'bg-background/20';
  const followBtnBg =
    variant === 'bright' ? 'bg-dark' : 'bg-background';

  return (
    <div className="flex flex-row items-center gap-2 text-white justify-end flex-none">
      {!didUserCanAdministrate && userBlockchainData && !inHub && (
      <button
          className={`flex px-3 sm:px-6 py-1.5 text-[12px] md:text-base rounded-md font-montserrat font-medium ${followBtnBg}`}
          onClick={() => joinSpace()}
        >
          <span className="flex items-center">
            Join
          </span>
      </button>
      )}
      {externalLinks.x && (
        <a href={externalLinks.x} target="_blank" rel="noreferrer">
          <button className={`p-2 sm:p-3 rounded-xl ${iconBtnBg}`}>
            <FaXTwitter className="w-4 h-4 md:w-9 md:h-9" />
          </button>
        </a>
      )}
      {externalLinks.discord && (
        <a href={externalLinks.discord} target="_blank" rel="noreferrer">
          <button className={`p-2 sm:p-3 rounded-xl ${iconBtnBg}`}>
            <FaDiscord className="w-4 h-4 md:w-9 md:h-9" />
          </button>
        </a>
      )}
      {externalLinks.linkedIn && (
        <a href={externalLinks.linkedIn} target="_blank" rel="noreferrer">
          <button className={`p-2 sm:p-3 rounded-xl ${iconBtnBg}`}>
            <FaLinkedin className="w-4 h-4 md:w-9 md:h-9" />
          </button>
        </a>
      )}
      {externalLinks.telegram && (
        <a href={externalLinks.telegram} target="_blank" rel="noreferrer">
          <button className={`p-2 sm:p-3 rounded-xl ${iconBtnBg}`}>
            <FaTelegram className="w-4 h-4 md:w-9 md:h-9" />
          </button>
        </a>
      )}
    </div>
  );
};

export default SpaceExternalLinks;
