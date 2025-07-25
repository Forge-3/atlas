import React, { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, type SubmitHandler } from "react-hook-form";
import Button from "../components/Shared/Button";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  useAuthAtlasMainActor,
  useUnAuthAtlasMainActor,
} from "../hooks/identityKit";
import { useSpaceId } from "../hooks/space";
import toast from "react-hot-toast";
import { useAuth } from "@nfid/identitykit/react";
import WalletAddressInputForm from "../components/Shared/WalletAddressInputForm";
import { getAtlasUser, transferSpaceTo } from "../canisters/atlasMain/api";
import { Principal } from "@dfinity/principal";
import { getErrorWithInfoToast } from "../utils/errors";

interface TransferSpaceFormInput {
  principal: string;
}

const schema = yup.object({
  principal: yup
    .string()
    .matches(
      /^([a-z0-9]{5}-){10}[a-z0-9]{3}$/,
      "Enter a valid wallet address (principal)"
    )
    .required("Principal is required"),
});

interface TransferSpaceModalArgs {
  callback: () => void;
}

const TransferSpaceModal = ({ callback }: TransferSpaceModalArgs) => {
  const { spacePrincipal } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authAtlasMain = useAuthAtlasMainActor();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const parsedSpacePrincipal = useSpaceId({
    spacePrincipal,
    navigate,
  });

  if (!parsedSpacePrincipal) return <></>;
  const onSubmit: SubmitHandler<TransferSpaceFormInput> = async ({
    principal,
  }) => {
    setIsSubmitting(true);
    try {
      const toUserId = Principal.from(principal);
      if (!authAtlasMain || !principal || !user) return;

      const call = transferSpaceTo({
        authAtlasMain,
        toUserId,
        spaceId: parsedSpacePrincipal,
      });

      await toast.promise(call, {
        loading: "Trying to transfer space.",
        success: "Successfully transferred space.",
        error: getErrorWithInfoToast("Failed transfer space:"),
      });
      await getAtlasUser({
        unAuthAtlasMain,
        dispatch,
        userId: user.principal,
      });
      callback();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className={`fixed inset-0 flex items-center justify-center h-full ${
          isSubmitting ? "z-30" : "z-50"
        }`}
        onClick={callback}
      >
        <div
          className="flex flex-col rounded-xl bg-white p-[20px] gap-[10px] w-[40rem] max-h-[80vh] overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h2 className="flex items-center justify-between font-semibold mb-4">
            Transfer space
            <Button className="flex gap-2">Transfer space</Button>
          </h2>
          <div className="border-l-2 pl-2 border-[#9173FF] border-dashed lex items-center justify-between font-semibold gap-2">
            <WalletAddressInputForm
              register={register}
              name="principal"
              placeholder="Enter the principal"
              className="py-3 px-4 rounded-xl bg-white/20 backdrop-blur-sm border-0"
              errors={errors}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default TransferSpaceModal;
