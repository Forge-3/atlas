import React from "react";
import {
  ConnectWallet,
  type ConnectWalletButtonProps,
  ConnectWalletDropdownMenu,
} from "@nfid/identitykit/react";
import { motion } from "framer-motion";
import Button from "../Shared/Button.tsx";

const ConnectButtonComponent = (props: ConnectWalletButtonProps) => (
  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
    <Button
      onClick={(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
      ) => props.onClick!(event)} content={"Join"}    />
  </motion.div>
)

export default () => {
  return (
    <div className="absolute top-0 w-full">
      <div className="py-2 sticky top-0 z-50 md:h-[5.5rem] dlg:h-[7rem] px-10 rounded-b-xl flex justify-between items-center mx-3  backdrop-blur-lg shadow-lg bg-[#1E0F33]/30">
        <div className="flex items-center gap-5 ml-6 ">
          <img
            src="/logos/logo.png"
            alt="atlas"
            className="md:h-[2rem] dlg:h-[2.6rem] "
          />
        </div>
        <ConnectWallet
          connectButtonComponent={ConnectButtonComponent}
        />
      </div>
    </div>
  );
};
