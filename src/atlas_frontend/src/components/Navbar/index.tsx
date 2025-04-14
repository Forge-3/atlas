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
import { FiLogOut, FiCopy } from "react-icons/fi";
import { copy } from "../../utils/shared.ts";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setScreenBlur } from "../../store/slices/appSlice.ts";
import type { RootState } from "../../store/store.ts";

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
  const copyAccount = () => {
    copy(connectedAccount);
  };
  const disconnectWallet = () => {
    disconnect();
    window.location.href = "/";
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
          <ul className="absolute -bottom-18 bg-white right-0 px-6 py-2 rounded-xl text-nowrap text-sm">
            <li onClick={copyAccount}>
              <button className="flex justify-between gap-6 items-center justify-center w-full">
                <div>Wallet address</div>{" "}
                <div className="flex items-center justify-center">
                  {shortPrincipal(connectedAccount)} <FiCopy className="ml-2" />
                </div>
              </button>
            </li>
            <li onClick={disconnectWallet}>
              <button className="flex justify-between gap-6 items-center justify-center w-full">
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
  const nav = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const userDiscordData = useSelector((state: RootState) => state.user.integrations.discord)

  useEffect(() => {
    if (!user) {
      return;
    }
    nav("/app");
    if (userDiscordData) {
      return;
    }
    dispatch(setScreenBlur(true));
  }, [nav, user, userDiscordData]);

  return (
    <div className="sticky top-0 w-full z-30">
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
              <Button light={location?.pathname !== "/app"}>Misson</Button>
              <Button light={location?.pathname !== "/app/leaderboard"}>
                Leaderboard
              </Button>
              <Button light={location?.pathname !== "/app/referrals"}>
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
