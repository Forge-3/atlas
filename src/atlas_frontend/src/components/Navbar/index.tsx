import React, { useEffect, useState } from "react";
import {
  ConnectWallet,
  useAuth,
  type ConnectWalletButtonProps,
} from "@nfid/identitykit/react";
import Button from "../Shared/Button.tsx";
import { type MenuProps } from "@headlessui/react";
import { shortPrincipal } from "../../utils/icp.ts";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiCopy, FiPlus } from "react-icons/fi";
import { copy } from "../../utils/shared.ts";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setConfig } from "../../store/slices/appSlice.ts";
import type { RootState } from "../../store/store.ts";
import { useAuthenticatedAtlasMainActor } from "../../hooks/identityKit.ts";
import type { Principal } from "@dfinity/principal";
import {
  selectUserBlockchainData,
  setUserBlockchainData,
} from "../../store/slices/userSlice.ts";
import { toast } from "react-hot-toast";
import { unAuthenticatedAtlasMainActor } from "../../canisters/atlasMain/actors.ts";
import { SPACE_BUILDER_PATH } from "../../router/index.tsx";

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
  const [userDropdown, setUserDropdown] = useState(false);
  const authenticatedAtlasBackend = useAuthenticatedAtlasMainActor();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userBlockchainData = useSelector(selectUserBlockchainData);
  const config = useSelector((state: RootState) => state.app.blockchainConfig);

  const copyAccount = () => {
    copy(connectedAccount);
  };
  const disconnectWallet = () => {
    disconnect();
    window.location.href = "/";
  };
  const getAtlasUser = async (userId: Principal) => {
    const userData = await authenticatedAtlasBackend?.get_user(userId);
    if (!userData) {
      toast.error("Failed to get user data from ICP");
      return;
    }
    dispatch(
      setUserBlockchainData({
        ...userData,
        owned_spaces: Array.from(userData.owned_spaces),
      })
    );
  };
  const getAtlasConfig = async () => {
    const config = await unAuthenticatedAtlasMainActor.app_config();
    if (!config) {
      toast.error("Failed to get config from ICP");
      return;
    }
    dispatch(setConfig(config));
  };

  useEffect(() => {
    getAtlasConfig();
  }, [dispatch]);

  useEffect(() => {
    if (user?.principal && authenticatedAtlasBackend) {
      getAtlasConfig();
      getAtlasUser(user.principal);
    }
  }, [authenticatedAtlasBackend, user, dispatch]);

  const ownedSpacesCount = userBlockchainData?.owned_spaces.length;
  const navigateToSpaceBuilder = () => {
    if (
      ownedSpacesCount === undefined ||
      config?.spaces_per_space_lead === undefined
    ) {
      return;
    }
    if (
      ownedSpacesCount < config?.spaces_per_space_lead &&
      userBlockchainData?.getRank() === "SpaceLead"
    ) {
      navigate(SPACE_BUILDER_PATH);
      return;
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setUserDropdown(!userDropdown)} className="flex">
        <img
          src="/icons/user-avatar-small.png"
          className="h-16"
          draggable="false"
        />
      </button>
      {userDropdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <ul className="absolute right-0 px-6 py-2 text-sm bg-white -bottom-18 rounded-xl text-nowrap">
            <li onClick={copyAccount}>
              <button className="flex items-center justify-center justify-between w-full gap-6">
                <div>Wallet address</div>{" "}
                <div className="flex items-center justify-center">
                  {shortPrincipal(connectedAccount)} <FiCopy className="ml-2" />
                </div>
              </button>
            </li>
            {userBlockchainData?.getRank() === "SpaceLead" && (
              <li onClick={navigateToSpaceBuilder}>
                <button className="flex items-center justify-center justify-between w-full gap-6">
                  <div>
                    Create new space ({ownedSpacesCount}/
                    {config?.spaces_per_space_lead})
                  </div>{" "}
                  <div className="flex items-center justify-center">
                    <FiPlus />
                  </div>
                </button>
              </li>
            )}
            <li onClick={disconnectWallet}>
              <button className="flex items-center justify-center justify-between w-full gap-6">
                <div>Disconnect</div>{" "}
                <div className="flex items-center justify-center">
                  <FiLogOut className="ml-2" />
                </div>
              </button>
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const userBlockchainData = useSelector(selectUserBlockchainData);

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
          {user && userBlockchainData && (
            <div className="flex items-center justify-center gap-4">
              <Button light={location?.pathname !== "/space"}>Spaces</Button>
              <Button light={location?.pathname !== "/space/leaderboard"}>
                Leaderboard
              </Button>
              <Button light={location?.pathname !== "/space/referrals"}>
                Referrals
              </Button>
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
