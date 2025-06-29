import React from "react";
import WalletIcon from "../../icons/wallet.svg?react";
import { motion } from "framer-motion";
import { useAuth } from "@nfid/identitykit/react";
import { useNavigate } from "react-router-dom";
import { authGuard } from "../../hooks/guard";
import DecimalInputForm from "../Shared/DecimalInputForm";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getCkUsdcBalance } from "../../hooks/balances";
import { useDispatch, useSelector } from "react-redux";
import { selectUserCkUsdc } from "../../store/slices/userSlice";
import { formatUnits, parseUnits } from "ethers";
import { DECIMALS } from "../../canisters/ckUsdcLedger/constans";
import {
  selectBlockchainConfig,
  type StorableConfig,
} from "../../store/slices/appSlice";
import WalletAddressInputForm from "../Shared/WalletAddressInputForm";
import {
  useAuthCkUsdcLedgerActor,
  useUnAuthCkUsdcLedgerActor,
} from "../../hooks/identityKit";
import {
  getUserBalance,
  transferToPrincipal,
} from "../../canisters/ckUsdcLedger/api";
import { Principal } from "@dfinity/principal";
import toast from "react-hot-toast";
import { deserialize } from "../../store/store";
import { getErrorWithInfoToast } from "../../utils/errors";
import { runWithLoading } from "../../utils/loading";

const WalletHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useAuth();
  authGuard({
    navigate,
    user,
  });
  const authCkUsdc = useAuthCkUsdcLedgerActor();
  const unAuthCkUsdcActor = useUnAuthCkUsdcLedgerActor();
  const userCkUsdc = deserialize<bigint>(useSelector(selectUserCkUsdc));
  const parsedUserCkUsdc =
    userCkUsdc !== null ? formatUnits(userCkUsdc, DECIMALS) : null;

  const blockchainConfig = deserialize<StorableConfig>(
    useSelector(selectBlockchainConfig)
  );
  const ckUsdcFee = blockchainConfig
    ? (blockchainConfig.ckusdc_ledger.fee ?? 0n)
    : 0n;
  const maxAmount = userCkUsdc ? userCkUsdc - ckUsdcFee : 0n;
  const parsedCkUsdcFee = formatUnits(ckUsdcFee, DECIMALS);
  const maxAmountDecimal = formatUnits(maxAmount, DECIMALS);

  interface WithdrawalFormInput {
    withdrawalAmount: number;
    withdrawalPrincipal: string;
  }

  const schema = yup.object({
    withdrawalAmount: yup
      .number()
      .typeError("Withdrawal amount must be a number")
      .min(0.1)
      .max(Number(maxAmountDecimal))
      .required()
      .label("Withdrawal amount"),
    withdrawalPrincipal: yup
      .string()
      .max(63)
      .matches(
        /^([a-z0-9]{5}-){10}[a-z0-9]{3}$/,
        "Enter a valid wallet address (principal)"
      )
      .notOneOf([user?.principal.toString()], "You cannot transfer to yourself")
      .required("Principal is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      withdrawalAmount: undefined,
      withdrawalPrincipal: undefined,
    },
  });
  getCkUsdcBalance({
    dispatch,
  });

  const handleWithdrawFunds: SubmitHandler<WithdrawalFormInput> = async (data) => {
    await runWithLoading(async () => {
      let userPrincipal: Principal;
      try {
        userPrincipal = Principal.from(data.withdrawalPrincipal);
      } catch {
        toast.error("Invalid principal address.");
        return;
      }

      const amount = parseUnits(data.withdrawalAmount.toString(), DECIMALS);
      if (!authCkUsdc || !user?.principal) return;
      const call = transferToPrincipal({
        authCkUsdc,
        userPrincipal,
        amount,
      });
      await toast.promise(call, {
        loading: "Withdrawing funds...",
        success: "Funds Withdrawn successfully.",
        error: getErrorWithInfoToast("Insufficient funds."),
      });
      await getUserBalance({
        unAuthCkUsdc: unAuthCkUsdcActor,
        userPrincipal: user?.principal,
        dispatch,
      });
    }, dispatch);
  };

  const setMax = () => {
    setValue("withdrawalAmount", Number(maxAmountDecimal));
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden font-montserrat">
      <div className="absolute inset-0 bg-[url(/reward-bg-img.png)] mix-blend-luminosity bg-cover bg-center z-0" />
      <div className="relative px-4 py-6 sm:px-8 md:px-16 md:py-12 z-10 font-montserrat font-medium flex items-center justify-center">
        <div className="w-full flex flex-col gap-6 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
          <form
            className="flex flex-col gap-3 text-white"
            onSubmit={handleSubmit(handleWithdrawFunds)}
          >
            <div className="border-[#9173FF] border-[3px] py-4 px-6 flex gap-2 items-center justify-center w-fit mx-auto rounded-2xl">
              <div className="text-white text-base sm:text-3xl">
                Smart <br />
                Wallet
              </div>
              <WalletIcon className="h-12 sm:h-16" />
              <div className="bg-[#9173FF]/30 text-white px-2 py-1 text-[14px] sm:px-6 sm:py-4 sm:text-lg rounded-2xl backdrop-blur-sm text-center">
                {parsedUserCkUsdc} XP
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-white text-base sm:text-3xl text-white text-center">
                Withdraw
              </div>

              <WalletAddressInputForm
                register={register}
                maxLength={63}
                name="withdrawalPrincipal"
                placeholder="Enter the principal"
                className="py-3 px-4 rounded-xl bg-white/20 backdrop-blur-sm border-0"
                errors={errors}
              />
              <div className="relative">
                <DecimalInputForm
                  register={register}
                  name="withdrawalAmount"
                  placeholder="Enter the amount"
                  className="py-3 px-4 rounded-xl bg-white/20 backdrop-blur-sm border-0"
                  errors={errors}
                  maxValue={1000}
                />
                <span
                  className="absolute text-[#9173FF] top-3 right-6 cursor-pointer select-none"
                  onClick={setMax}
                >
                  max
                </span>
              </div>

              {parsedCkUsdcFee && (
                <div className="text-white mx-auto bg-[#9173FF]/40 w-fit py-1 px-4 rounded-full font-normal">
                  Fee: {parsedCkUsdcFee} XP
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="text-white border-2 w-fit mx-auto px-6 py-2 rounded-2xl"
              >
                Confirm
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WalletHeader;
