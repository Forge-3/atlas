import React from "react";
import TransactionHistory from "./TransactionHistory";
import WalletHeader from "./WalletHeader";
import { useAuth } from "@nfid/identitykit/react";
import { useNavigate } from "react-router-dom";
import { authGuard } from "../../hooks/guard";

const Wallet = () => {
  const tokenSymbol = "ckUSDC"
  const navigate = useNavigate();
  const { user } = useAuth();
  
  authGuard({
    navigate,
    user,
  });

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <WalletHeader />
        <TransactionHistory tokenSymbol={tokenSymbol}/>
      </div>
    </div>
  );
};

export default Wallet;
