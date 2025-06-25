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
import { FiLogOut, FiCopy } from "react-icons/fi";
import { copy } from "../../utils/shared.ts";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store.ts";
import { useUnAuthAtlasMainActor } from "../../hooks/identityKit.ts";
import {
  selectUserBlockchainData,
  selectUserCkUsdc,
} from "../../store/slices/userSlice.ts";
import { getAtlasConfig, getAtlasUser } from "../../canisters/atlasMain/api.ts";
import { SPACE_BUILDER_PATH, SPACES_PATH, WALLET } from "../../router/paths.ts";
import { formatUnits } from "ethers";
import { DECIMALS } from "../../canisters/ckUsdcLedger/constans.ts";
import UserIcon from "./UserIcon.tsx";
import WalletIcon from "../../icons/wallet.svg?react";
import { FaPlus } from "react-icons/fa";
import { getCkUsdcBalance } from "../../hooks/balances.ts";

const ConnectButton = (props: ConnectWalletButtonProps) => (
  <Button
    onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
      props.onClick!(event)
    }
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
  const userBlockchainData = useSelector(selectUserBlockchainData);
  const appConfig = useSelector(
    (state: RootState) => state.app.blockchainConfig
  );

  const copyAccount = () => {
    copy(connectedAccount);
  };
  const disconnectWallet = () => {
    disconnect();
    window.location.href = "/";
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
      if (!userBlockchainData) {
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
  const userCkUsdc = useSelector(selectUserCkUsdc);
  const parsedUserCkUsdc =
    userCkUsdc !== null ? formatUnits(userCkUsdc, DECIMALS) : null;

  const ownedSpacesCount = userBlockchainData?.owned_spaces.length;
  const userCanCreateSpace =
    (userBlockchainData?.isSpaceLead() &&
      ownedSpacesCount !== undefined &&
      appConfig?.spaces_per_space_lead !== undefined &&
      ownedSpacesCount < appConfig?.spaces_per_space_lead) ??
    false;

  const navigateToSpaceBuilder = () => {
    if (userCanCreateSpace) {
      navigate(SPACE_BUILDER_PATH);
      return;
    }
  };

  return (
    <Menu>
      <MenuButton data-hover={true}>
        <UserIcon />
      </MenuButton>
      <MenuItems
        modal={false}
        anchor="bottom end"
        className="origin-top-right rounded-xl border border-[#9173FF33] bg-gradient-to-b from-[#1E0F33]/80 to-[#9173FF]/10 backdrop-blur-lg p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 !z-[100] overflow-none px-6 py-4"
      >
        <MenuItem>
          <div className="flex justify-center items-center gap-2 mt-2">
            <div>
              <UserIcon className="h-12" />
            </div>
            {/* <div className="bg-[#1E0F33] font-montserrat font-medium px-4 py-2 rounded-md flex-1 h-10"></div> */}
          </div>
        </MenuItem>
        {parsedUserCkUsdc !== null && (
          <MenuItem>
            <a
              className="flex justify-center items-center gap-2 mt-2 w-full"
              href={WALLET}
            >
              <div>
                <WalletIcon className="h-9" />
              </div>
              <div className="bg-[#9173FF]/20 h-full font-montserrat font-medium px-4 py-2 rounded-md flex-1 text-center flex-1">
                {parsedUserCkUsdc} XP
              </div>
            </a>
          </MenuItem>
        )}
        <MenuItem>
          <button
            className="flex items-center justify-center justify-between mt-2 w-full text-[#9173FF] gap-4"
            onClick={copyAccount}
          >
            <div>Address:</div>
            <div className="flex items-center justify-center">
              {shortPrincipal(connectedAccount)} <FiCopy className="ml-2" />
            </div>
          </button>
        </MenuItem>
        {userCanCreateSpace && (
          <MenuItem>
            <button
              className="bg-[#1E0F33] font-montserrat font-medium px-4 py-2 rounded-md mt-2 text-center w-full flex items-center justify-center gap-1"
              onClick={navigateToSpaceBuilder}
            >
              Create new space <FaPlus />
            </button>
          </MenuItem>
        )}
        <MenuItem>
          <button
            className="bg-[#9173FF] flex items-center justify-center w-full font-montserrat font-medium px-4 py-1 rounded-md mt-2"
            onClick={disconnectWallet}
          >
            <div>Log out</div>
            <div className="flex items-center justify-center">
              <FiLogOut className="ml-2" />
            </div>
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  getCkUsdcBalance({
    dispatch,
  });

  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="py-6 top-0 px-10 rounded-b-xl flex justify-between items-center mx-3 backdrop-blur-lg shadow-lg bg-[#1E0F33]/30">
        <a className="flex items-center gap-5" href="/">
          <img
            src="/logos/logo.png"
            alt="Atlas logo"
            className="h-8"
            draggable="false"
          />
        </a>
        <div className="flex items-center justify-center gap-4">
          {user && (
            <div className="flex items-center justify-center gap-4">
              <Button
                light={location?.pathname !== "/space"}
                onClick={() => navigate(SPACES_PATH)}
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
        </div>
      </div>
    </div>
  );
};

export default Navbar;
