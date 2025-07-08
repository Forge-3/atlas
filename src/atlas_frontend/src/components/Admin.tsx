import React, { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import GradientBox from "../layouts/GradientBox";
import Button from "./Shared/Button";
import WalletAddressInputForm from "./Shared/WalletAddressInputForm";
import {
  getAllSpaces,
  promoteUserToSpaceLead,
  upgradeSpace,
} from "../canisters/atlasMain/api";
import {
  getUnAuthAtlasSpaceActor,
  useAuthAtlasMainActor,
  useUnAuthAgent,
  useUnAuthAtlasMainActor,
} from "../hooks/identityKit";
import { Principal } from "@dfinity/principal";
import toast from "react-hot-toast";
import { authGuard } from "../hooks/guard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch, useSelector } from "react-redux";
import { deserialize, type RootState } from "../store/store";
import type { StorableConfig } from "../store/slices/appSlice";
import { shortPrincipal } from "../utils/icp";
import { getAtlasSpace } from "../canisters/atlasSpace/api";
import type { Spaces } from "../store/slices/spacesSlice";
import { copy } from "../utils/shared";
import { FiCopy } from "react-icons/fi";
import { getErrorWithInfoToast } from "../utils/errors";
import { runWithLoading } from "../utils/loading";

interface AdminFormInput {
  principal: string;
}

const Admin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const [fetchedSpacesData, setFetchedSpacesData] = useState(false);
  const agent = useUnAuthAgent();

  const { user } = useAuth();
  const appConfig = deserialize<StorableConfig>(
    useSelector((state: RootState) => state.app.blockchainConfig)
  );
  const spaces = deserialize<Spaces>(
    useSelector((state: RootState) => state.spaces.spaces)
  );

  useEffect(() => {
    if (unAuthAtlasMain && !spaces) {
      getAllSpaces({
        dispatch,
        unAuthAtlasMain,
      });
    }
  }, [dispatch, unAuthAtlasMain]);

  useEffect(() => {
    if (!spaces || fetchedSpacesData || !agent) return;
    Object.keys(spaces).map(async (spaceId) => {
      const spacePrincipal = Principal.from(spaceId);
      getUnAuthAtlasSpaceActor(agent, spacePrincipal);
      const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, spacePrincipal);
      if (!unAuthAtlasSpace) return;
      await getAtlasSpace({
        spaceId,
        unAuthAtlasSpace,
        dispatch,
      });
    });
    setFetchedSpacesData(true);
  }, [dispatch, spaces, fetchedSpacesData]);

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

  const handlePromoteUser: SubmitHandler<AdminFormInput> = async ({ principal }) => {
    const userId = Principal.from(principal);
    if (!authAtlasMain) return;

    await runWithLoading(async () => {
      const call = promoteUserToSpaceLead({
        authAtlasMain,
        userId,
      });
      await toast.promise(call, {
        loading: "Promoting user to space lead...",
        success: "Successfully promoted user.",
        error: getErrorWithInfoToast("Failed promote user."),
      });
    }, dispatch);
  };

  const upgradeSpecificSpace = async (spacePrincipal: Principal) => {
    if (!authAtlasMain) return;

    const call = upgradeSpace({
      authAtlasMain,
      spaceId: spacePrincipal,
    });

    await toast.promise(call, {
      loading: "Upgrading space...",
      success: "Successfully upgraded space.",
      error: getErrorWithInfoToast("Failed to upgrade space."),
    });
    const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, spacePrincipal);
    if (!unAuthAtlasSpace) return;
    await getAtlasSpace({
      spaceId: spacePrincipal.toString(),
      unAuthAtlasSpace,
      dispatch,
    });
  };
  const copyAccount = (spacePrincipal: string) => {
    copy(spacePrincipal);
  };

  return (
    <div className="container mx-auto my-4">
      <div className="w-full px-3">
        <h2 className="text-2xl font-medium py-10 px-8 font-montserrat text-white">
          Admin panel
        </h2>
        <form
          className="flex flex-col gap-3 text-white"
          onSubmit={handleSubmit(handlePromoteUser)}
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
        <GradientBox>
          <div className="flex flex-col gap-2 py-10 px-8 font-montserrat text-white">
            <h2 className="text-2xl font-medium">Upgrade spaces</h2>
            <p>
              Current space bytecode version:{" "}
              <b>
                {appConfig?.current_space_version
                  ? appConfig.current_space_version.toString()
                  : ""}
              </b>
            </p>
          </div>
          <table className="table-auto mt-6 w-full text-white text-center rtl:text-right border-separate border-spacing-x-2 font-montserrat">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3">
                  Principal
                </th>
                <th scope="col" className="px-4 py-3">
                  Space name
                </th>
                <th scope="col" className="px-4 py-3">
                  Space version
                </th>
                <th scope="col" className="px-4 py-3">
                  Upgrade
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(spaces ?? {}).map(
                ([spacePrincipal, spaceData]) => (
                  <tr key={spacePrincipal}>
                    <td className="flex items-center justify-center gap-2" onClick={() => copyAccount(spacePrincipal)}>
                      {shortPrincipal(spacePrincipal)}{" "}
                      <FiCopy />
                    </td>
                    <td>
                      {spaceData?.state ? spaceData.state.space_name : "N/A"}
                    </td>
                    <td>
                      {spaceData?.state
                        ? spaceData.state.version.toString()
                        : "N/A"}
                    </td>
                    <td className="flex items-center justify-center">
                      {(spaceData?.state?.version ?? 0n) <
                      (appConfig?.current_space_version ?? 0n) ? (
                        <Button
                          onClick={() =>
                            upgradeSpecificSpace(Principal.from(spacePrincipal))
                          }
                        >
                          Upgrade
                        </Button>
                      ) : (
                        "Up to date"
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </GradientBox>
      </div>
    </div>
  );
};

export default Admin;
