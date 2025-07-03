import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import GradientBox from "../layouts/GradientBox";
import Button from "./Shared/Button";
import WalletAddressInputForm from "./Shared/WalletAddressInputForm";
import { promoteUserToSpaceLead } from "../canisters/atlasMain/api";
import { useAuthAtlasMainActor } from "../hooks/identityKit";
import { Principal } from "@dfinity/principal";
import toast from "react-hot-toast";
import { authGuard } from "../hooks/guard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@nfid/identitykit/react";

interface AdminFormInput {
  principal: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  authGuard({
    navigate,
    user,
  });

  const authAtlasMain = useAuthAtlasMainActor();
  const schema = yup.object({
    principal: yup
      .string()
      .matches(
        /^([a-z0-9]{5}-){10}[a-z0-9]{3}$/,
        "Enter a valid wallet address (principal)"
      )
      .required("Principal is required"),
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit: SubmitHandler<AdminFormInput> = async ({ principal }) => {
    const userId = Principal.from(principal);

    if (!authAtlasMain) return;
    const call = promoteUserToSpaceLead({
      authAtlasMain,
      userId,
    });
    await toast.promise(call, {
      loading: "Promoting user to space lead...",
      success: "Successfully promoted user",
      error: "Failed promote user",
    });
  };

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <h2 className="text-2xl font-medium py-10 px-8 font-montserrat text-white">
          Admin panel
        </h2>
        <form
          className="flex flex-col gap-3 text-white"
          onSubmit={handleSubmit(onSubmit)}
        >
          <GradientBox>
            <div className="px-8 font-montserrat text-white pt-8">
              <div className="flex gap-2 flex-col">
                <h3 className="text-xl font-medium">Set space leader</h3>
                <p>Promote user to space lead</p>
                <WalletAddressInputForm
                  register={register}
                  name="principal"
                  placeholder="Enter the principal"
                  className="py-3 px-4 rounded-xl bg-white/20 backdrop-blur-sm border-0"
                  errors={errors}
                />
                <div className="flex justify-end">
                  <Button>Promote user</Button>
                </div>
              </div>
            </div>
          </GradientBox>
        </form>
      </div>
    </div>
  );
};

export default Admin;
