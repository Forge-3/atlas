import React, { useEffect, useState } from "react";
import {
  ConnectWallet,
  useAuth,
  type ConnectWalletButtonProps,
} from "@nfid/identitykit/react";
import Button from "../Shared/Button.tsx";
import { type MenuProps } from "@headlessui/react";
import { shortPrincipal } from "../../utils/icp.ts";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiCopy } from "react-icons/fi";
import { copy } from "../../utils/shared.ts";
import { motion } from "framer-motion";

const ConnectButton = (props: ConnectWalletButtonProps) => (
  <Button
    onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
      props.onClick!(event)
    }
    content={"Join"}
  />
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

  return (
    <div className="relative">
      <button onClick={() => setUserDropdown(!userDropdown)} className="flex">
        <img src="/icons/user-avatar-small.png" className="h-16" />
      </button>
      {userDropdown && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <ul className="absolute -bottom-18 bg-white right-0 px-6 py-2 rounded-xl text-nowrap text-sm ">
            <li onClick={copyAccount}>
              <button className="flex justify-between gap-6 items-center justify-center w-full">
                <div>Wallet address</div>{" "}
                <div className="flex items-center justify-center">
                  {shortPrincipal(connectedAccount)} <FiCopy className="ml-2" />
                </div>
              </button>
            </li>
            <li onClick={disconnect}>
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
  
  useEffect(() => {
    if (user) {
      nav('/app');
    }
  }, [nav, user]);

  return (
    <div className="sticky top-0 w-full">
      <div className="py-2 sticky top-0 z-50 px-10 rounded-b-xl flex justify-between items-center mx-3 backdrop-blur-lg shadow-lg bg-[#1E0F33]/30">
        <div className="flex items-center gap-5 ml-6">
          <img
            src="/logos/logo.png"
            alt="atlas"
            className="md:h-[2rem] dlg:h-[2.6rem]"
          />
        </div>
        <ConnectWallet
          connectButtonComponent={ConnectButton}
          dropdownMenuComponent={DropdownMenuComponent}
        />
      </div>
    </div>
  );
};

export default Navbar;
