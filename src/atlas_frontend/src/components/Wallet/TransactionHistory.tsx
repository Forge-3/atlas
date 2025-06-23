import React from "react";
import { shortPrincipal } from "../../utils/icp";
import { formatUnits } from "ethers";
import { DECIMALS } from "../../canisters/ckUsdcLedger/constans";
import { formatUtcDate, timeAgo } from "../../utils/date";
import { useAuth } from "@nfid/identitykit/react";
import { useUnAuthCkUsdcIndexerActor } from "../../hooks/identityKit";
import { getUserTransactions } from "../../canisters/ckUsdcIndex/api";
import { useDispatch, useSelector } from "react-redux";
import { authGuard } from "../../hooks/guard";
import { useNavigate } from "react-router-dom";
import { selectUserTxs } from "../../store/slices/userSlice";
import { formatTransactions } from "../../canisters/ckUsdcIndex/transactions";

interface TransactionHistoryProps {
  tokenSymbol: string;
}

const TransactionHistory = ({ tokenSymbol }: TransactionHistoryProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const unAuthCkUsdIndexer = useUnAuthCkUsdcIndexerActor();
  const dispatch = useDispatch();
  const userTxs = useSelector(selectUserTxs);
  authGuard({
    navigate,
    user,
  });

  if (!user?.principal) return <></>;
  getUserTransactions({
    unAuthCkUsdIndexer,
    userPrincipal: user?.principal,
    start: null,
    maxResults: 100n,
    dispatch,
  });
  // TODO: PAGINATION AND LOAD MORE SPACES
  // TODO: SORTING
  // TODO: ADD COPY OF PRINCIPAL

  const transactions = formatTransactions(userTxs).reverse();
  return (
    <div className="w-full mt-4">
      <div className="w-full rounded-xl overflow-hidden font-montserrat">
        <div className="inset-0 bg-gradient-to-b from-[#522785] to-transparent px-8 bg-cover bg-center z-0">
          <div className="font-montserrat text-white text-2xl font-medium py-10">
            ICP Transaction
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-separate border-spacing-x-3 rounded-t-lg text-center">
              <thead className="text-white">
                <tr>
                  <th className="px-4 py-2 text-white">From</th>
                  <th className="px-4 py-2 text-white">To</th>
                  <th className="px-4 py-2 text-white">Tx Type</th>
                  <th className="px-4 py-2 text-white">Amount</th>
                  <th className="px-4 py-2 text-white">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 bg-[#9173FF]/5 text-white/60 text-sm text-nowrap">
                      {tx.from === "N/A"
                        ? "N/A"
                        : user?.principal.toString() === tx.from
                          ? "You"
                          : shortPrincipal(tx.from)}
                    </td>
                    <td className="px-4 py-2 bg-[#9173FF]/5 text-white/60 text-sm text-nowrap">
                      {tx.to === "N/A"
                        ? "N/A"
                        : user?.principal.toString() === tx.to
                          ? "You"
                          : shortPrincipal(tx.to)}
                    </td>
                    <td className="px-4 py-2 bg-[#9173FF]/5 text-white capitalize text-sm">
                      <div className={`px-2 py-[2px] rounded-full ${
                      tx.kind === "approve" ? "bg-[#9173FF]" : ""
                    } ${
                      tx.kind === "transfer" ? "bg-[#FFFFFF]/50" : ""
                    } ${
                      tx.kind === "mint" ? "bg-[#1E0F33]/50" : ""
                    } ${
                      tx.kind === "burn" ? "bg-[#1E0F33]" : ""
                    }`}>
                        {tx.kind}
                      </div>
                    </td>
                    <td className="px-4 py-2 bg-[#9173FF]/5 text-white text-right font-medium">
                      {formatUnits(tx.amount, DECIMALS)}{" "}
                      <span className="text-[#9173FF]">{tokenSymbol}</span>
                    </td>
                    <td className="px-4 py-2 bg-[#9173FF]/5 text-white">
                      <span className="font-medium text-sm">
                        {formatUtcDate(tx.timestamp)}
                      </span>
                      <span className="ml-2 text-xs text-white/60 text-nowrap">
                        {timeAgo(tx.timestamp)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
