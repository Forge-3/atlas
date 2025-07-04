import React, { useEffect } from "react";
import {
  ConnectWallet,
  useAuth,
  type ConnectWalletButtonProps,
} from "@nfid/identitykit/react";
import Button from "../Shared/Button.tsx";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  type MenuProps,
} from "@headlessui/react";
import { shortPrincipal } from "../../utils/icp.ts";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCopy } from "react-icons/fi";
import { copy } from "../../utils/shared.ts";
import { useDispatch, useSelector } from "react-redux";
import { deserialize } from "../../store/store.ts";
import { useUnAuthAtlasMainActor } from "../../hooks/identityKit.ts";
import {
  BlockchainUser,
  selectUserBlockchainData,
  selectUserCkUsdc,
  type StorableUser,
} from "../../store/slices/userSlice.ts";
import { getAtlasConfig, getAtlasUser } from "../../canisters/atlasMain/api.ts";
import {
  ADMIN_PATH,
  getCreateTaskPath,
  SPACES_PATH,
  WALLET_PATH,
} from "../../router/paths.ts";
import { formatUnits } from "ethers";
import { DECIMALS } from "../../canisters/ckUsdcLedger/constans.ts";
import UserIcon from "./UserIcon.tsx";
import { RiAddLine, RiWalletFill, RiLogoutBoxRLine } from 'react-icons/ri';
import { getCkUsdcBalance } from "../../hooks/balances.ts";
import { FaGear } from 'react-icons/fa6';
import { useSpaceNavigation } from "../../hooks/useSpaceNavigation.ts";

const ConnectButton = (props: ConnectWalletButtonProps) => (
  <Button
    onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
      props.onClick!(event)
    }
    variant="publish" 
    className="text-[14px] px-3 md:text-[18px] md:w-[110px] md:h-[33px] md:px-4 md:2my-2 sm:my-0"
  >
    Join
  </Button>
);

const DropdownMenuComponent = ({
  connectedAccount,
  disconnect,
}: MenuProps & {
  disconnect: () => unknown;
  icpBalance?: number;
  connectedAccount: string;
}) => {
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { navigateToSpaceBuilder, userCanCreateSpace, userInfo, appConfig } = useSpaceNavigation();
    
  const spaceLeadSpacePrincipal = userInfo?.isSpaceLead?.() && userInfo.owned_spaces.length === 1
    ? userInfo.owned_spaces[0].id
    : null;

  const copyAccount = () => {
    copy(connectedAccount);
  };
  const disconnectWallet = () => {
    disconnect();
    navigate("/");
  };

  useEffect(() => {
    if (unAuthAtlasMain && !appConfig)
      getAtlasConfig({
        dispatch,
        unAuthAtlasMain,
      });
  }, [dispatch, unAuthAtlasMain]);

  useEffect(() => {
    if (user?.principal && unAuthAtlasMain) {
      if (!appConfig) {
        getAtlasConfig({
          dispatch,
          unAuthAtlasMain,
        });
      }
      if (!userInfo) {
        getAtlasUser({
          dispatch,
          userId: user.principal,
          unAuthAtlasMain,
        });
      }
    }
  }, [unAuthAtlasMain, user, dispatch]);

  getCkUsdcBalance({
    dispatch,
  });
  const userCkUsdc = deserialize<bigint>(useSelector(selectUserCkUsdc));
  const parsedUserCkUsdc =
    userCkUsdc !== null ? formatUnits(userCkUsdc, DECIMALS) : null;

  return (
    <>
      <Menu>
        <MenuButton data-hover={true}>
          <UserIcon />
        </MenuButton>
        <MenuItems
          modal={false}
          anchor="bottom end"
          className="origin-top-right rounded-xl border border-primary/20  p-1 text-sm/6 text-light transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 !z-[100] overflow-none px-6 py-6"
          style={{backgroundImage: 'linear-gradient(to bottom, var(--color-dark) 0%, var(--color-background) 100%)'}}
        >
        <div className="flex flex-1 items-center gap-2">
          {/* <div className="bg-primary/20 h-[83px] w-[212px] rounded-lg p-[17px] pr-[20px] pl-[20px] flex items-center justify-center">
            <h6 className="font-montserrat font-semibold text-light text-h3">
              @username
            </h6>
          </div> */}
          <MenuItem>
            <div className="flex flex-col items-center w-full">
              <div>
                <UserIcon className="h-18"/>
              </div>
              {/* <div className="flex flex-row gap-1 mt-1">
                <div className="bg-background/20 h-5 w-5 items-center justify-center rounded flex">
                <BsTwitterX />
                </div>
                <div className="bg-background/20 h-5 w-5 items-center justify-center rounded flex">
                <FaDiscord />
                </div>
                <div className="bg-background/20 h-5 w-5 items-center justify-center rounded flex">
                <FaLinkedin />
                </div>
              </div> */}
            </div>
          </MenuItem>
        </div>
        {/* <div className="w-full h-[1px] bg-light2/20 my-2" />
          <div className="flex flex-col px-3 pt-2">
            <p className="text-primary font-montserrat font-medium">
            Rank
            </p>
            <p className="text-light font-montserrat font-medium">
            {rank}
            </p>
          </div>
          <ExperienceProgressBar exp={324} expToLvlUp={500} /> */}
        <div className="w-full h-[1px] bg-light2/20 my-2" />
          {parsedUserCkUsdc !== null && (
            <MenuItem>
              <div
                className="flex justify-center items-center gap-2 mt-2 w-full"
                onClick={() => navigate(WALLET_PATH)}
              >
                <div>
                  <RiWalletFill className="h-12 w-12 ml-2" color="primary" />
                </div>
                <div className="bg-primary/20 h-full font-montserrat px-4 py-2 mr-3 rounded-md flex-1 text-center">
                  {parsedUserCkUsdc} ckUSDC
                </div>
              </div>
            </MenuItem>
          )}
          <MenuItem>
            <button
            className="flex items-center justify-between w-full px-3 py-1 gap-2"
            onClick={copyAccount}
          >
            <p className="text-[14px] font-montserrat text-center font-medium text-white">
              Address:
            </p>
            <div className="flex w-full items-center justify-end gap-1 text-[14px] text-primary">
                {shortPrincipal(connectedAccount)} <FiCopy />
            </div>
          </button>
          </MenuItem>
            {userCanCreateSpace && (
            <div className="w-full h-[1px] bg-light2/20 my-2" />
          )}
          <div className="px-3 my-3">
            {userInfo?.isSpaceLead?.() && spaceLeadSpacePrincipal ? (
              <MenuItem>
                <button
                  className="bg-background font-montserrat font-medium px-4 py-2 rounded-md mt-2 text-center w-full flex items-center justify-center"
                  onClick={() => navigate(getCreateTaskPath(spaceLeadSpacePrincipal))}
                >
                  Create new mission <RiAddLine className="text-xl" />
                </button>
              </MenuItem>
            ) : userInfo?.isAdmin?.() || userInfo?.isSpaceLead?.() ? (
              <MenuItem>
                <button
                  className="bg-background font-montserrat font-medium px-4 py-2 rounded-md mt-2 text-center w-full flex items-center justify-center"
                  onClick={navigateToSpaceBuilder}
                >
                  Create new space <RiAddLine className="text-xl" />
                </button>
              </MenuItem>
            ) : null}
          </div>
          <div className="w-full h-[1px] bg-light2/20 my-2" />
          {/* <div className="px-3 my-3">
            {userInfo?.isAdmin() && (
              <MenuItem>
                <button
                  className="bg-primary/20 font-montserrat font-medium px-4 py-2 rounded-md mt-2 text-center w-full flex items-center justify-center gap-1"
                  onClick={() => navigate(ADMIN_PATH)}
                >
                  Community / Hubs
                </button>
              </MenuItem>
            )}
          </div>
          <div className="w-full h-[1px] bg-light2/20 my-2" /> */}
            <div className="flex flex-row gap-2 px-3">
              <div className="flex justify-center">
                {userInfo?.isAdmin() && (
                <MenuItem>
                  <button
                    className="bg-primary flex items-center justify-center w-full font-montserrat font-medium px-2.5 py-1 rounded-md mt-2"
                    onClick={() => navigate(ADMIN_PATH)}
                  >
                    <div className="flex items-center justify-center">
                      <FaGear />
                    </div>
                  </button>
                </MenuItem>
                )}
              </div>
              <MenuItem>
                <button
                  className="bg-primary flex items-center justify-center w-full font-montserrat px-4 py-1 rounded-md mt-2"
                  onClick={disconnectWallet}
                >
                  <div className="flex items-center justify-center">
                    <RiLogoutBoxRLine className="mr-1" />
                  </div>
                  <div>Log out</div>
                  
                </button>
              </MenuItem>
            </div>
        </MenuItems>
      </Menu>
    </>
  );
};

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
 
  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;
  
  const isAdmin = userInfo?.isAdmin?.() || userInfo?.isSuperAdmin?.() || userInfo?.isSpaceLead?.() || false;

  let bgNav = "bg-gradient-to-b from-background to-primary";

  const isCreateTaskPage = location.pathname.endsWith('/create-task');
  const isSubmissionsPage = location.pathname.includes('/summations');
  const isSpacePage = location.pathname.includes('/space/');
  
  if (isSpacePage && !(isCreateTaskPage || isSubmissionsPage)) {
    bgNav = isAdmin ? "bg-background" : "bg-dark";
  }

  getCkUsdcBalance({
    dispatch,
  });

  return (
    <div className="w-full">
      <div className={`py-1 sm:py-3 md:py-6 top-0 flex justify-between items-center px-4 md:px-10 min-h-[60px] md:min-h-[137px] backdrop-blur-lg shadow-lg ${bgNav}`}>
        <a className="flex items-center gap-5" onClick={() => navigate("/")}>
          <img
            src="/logos/logo.png"
            alt="Atlas logo"
            className="h-5 md:h-8"
            draggable="false"
          />
        </a>
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          {user && (
            <div className="flex">
              <Button
                variant={location?.pathname !== "/space" ? "publish" : "primary"}
                onClick={() => navigate(SPACES_PATH)}
                className="font-medium text-[12px] md:text-base px-4 md:px-6"
              >
                Spaces
              </Button>
              {/* <Button light={location?.pathname !== "/space/leaderboard"}>
                Leaderboard
              </Button> */}
                {/* <Button light={location?.pathname !== "/space/referrals"}>
                Referrals
              </Button> */}
              </div>
            )}
            <ConnectWallet
              connectButtonComponent={ConnectButton}
              dropdownMenuComponent={DropdownMenuComponent}
            />
            {!user && (
            <Button
            variant="saveDraft"
            className="text-[14px] px-3 md:text-[18px] md:w-[110px] md:h-[33px] md:px-4 md:2my-2 sm:my-0"
            disabled={true}
            onClick={() => navigate(SPACES_PATH)}>
            Discover
            </Button>
            )}
          </div>
        </div>
      </div>
  );
};

export default Navbar;
