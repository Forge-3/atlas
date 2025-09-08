import React from "react";
import { useAuth } from "@nfid/identitykit/react";
import { useNavigate } from "react-router-dom";
import { authGuard } from "../../hooks/guard";
import ReferralSection from "./ReferralsSection";

const Refferals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  authGuard({
    navigate,
    user,
  });

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <ReferralSection />
      </div>
    </div>
  );
};

export default Refferals;
