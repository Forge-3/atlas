import React, { useEffect, useState } from "react";
import Button from "../Shared/Button.tsx";
import Dropzone from "./Dropzone.tsx";
import imageCompression from "browser-image-compression";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  useAuthAtlasMainActor,
  useAuthAtlasSpaceActor,
  useUnAuthAtlasMainActor,
  useUnAuthAtlasSpaceActor,
} from "../../hooks/identityKit.ts";
import { createNewSpace, getAtlasUser } from "../../canisters/atlasMain/api.ts";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch, useSelector } from "react-redux";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../store/slices/userSlice.ts";
import { getSpacePath } from "../../router/paths.ts";
import { RiGalleryUploadFill } from "react-icons/ri";
import { FaDiscord, FaLinkedinIn, FaTelegramPlane } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { authGuard } from "../../hooks/guard.ts";
import { Principal } from "@dfinity/principal";
import { deserialize, type RootState } from "../../store/store.ts";
import { editSpace, getAtlasSpace } from "../../canisters/atlasSpace/api.ts";
import type { Space } from "../../store/slices/spacesSlice.ts";
import { getErrorWithInfoToast } from "../../utils/errors.ts";

const MAX_FILE_SIZE = 5_000_000;
const MAX_DESCRIPTION_LEN = 128;
const MAX_NAME_LEN = 32;
const MAX_LINK_LEN = 128;

interface SpaceBuilderFormInput {
  spaceName: string;
  spaceDescription: string;
  spaceDiscord?: yup.Maybe<undefined | string>;
  spaceTelegram?: yup.Maybe<undefined | string>;
  spaceX?: yup.Maybe<undefined | string>;
  spaceLinkedIn?: yup.Maybe<undefined | string>;
  avatarImg?: string;
  backgroundImg?: string;
}

const schema = yup.object({
  spaceDescription: yup
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LEN)
    .min(3)
    .required()
    .label("Description"),
  spaceName: yup
    .string()
    .max(MAX_NAME_LEN)
    .trim()
    .min(2)
    .required()
    .label("Name"),
  spaceDiscord: yup
    .string()
    .label("Discord link")
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid Discord URL")
    .matches(
      /^https:\/\/(www\.)?discord\.gg\/.+$/,
      "Must be a valid Discord invite link"
    )
    .max(MAX_LINK_LEN)
    .notRequired(),

  spaceTelegram: yup
    .string()
    .label("Telegram link")
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid Telegram URL")
    .matches(
      /^https:\/\/(t\.me|telegram\.me)\/.+$/,
      "Must be a valid Telegram link"
    )
    .max(MAX_LINK_LEN)
    .notRequired(),

  spaceX: yup
    .string()
    .label("X link")
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid Twitter or X URL")
    .matches(
      /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/?$/,
      "Must be a valid Twitter/X profile URL"
    )
    .max(MAX_LINK_LEN)
    .notRequired(),

  spaceLinkedIn: yup
    .string()
    .label("LinkedIn link")
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid LinkedIn URL")
    .matches(
      /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[A-Za-z0-9_-]+\/?$/,
      "Must be a valid LinkedIn profile or company URL"
    )
    .max(MAX_LINK_LEN)
    .notRequired(),

  avatarImg: yup.string().optional(),
  backgroundImg: yup.string().optional(),
});

const SpaceBuilder = () => {
  const navigate = useNavigate();
  const { spacePrincipal } = useParams();
  const [initEdit, setInitEdit] = useState(false);
  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;
  const authAtlasMain = useAuthAtlasMainActor();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const spaceData = spacePrincipal
    ? deserialize<Space>(
        useSelector(
          (state: RootState) => state.spaces?.spaces?.[spacePrincipal] ?? null
        )
      )
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      spaceDescription: spaceData?.state?.space_description,
      spaceName: spaceData?.state?.space_name,
    },
  });
  const parsedSpacePrincipal = spacePrincipal
    ? Principal.from(spacePrincipal)
    : null;
  const unAuthAtlasSpace = parsedSpacePrincipal
    ? useUnAuthAtlasSpaceActor(parsedSpacePrincipal)
    : null;
  const authAtlasSpace = parsedSpacePrincipal
    ? useAuthAtlasSpaceActor(parsedSpacePrincipal)
    : null;
  useEffect(() => {
    if (!spaceData?.state || initEdit) return;
    setInitEdit(true);
    reset({
      spaceName: spaceData.state.space_name || "",
      spaceDescription: spaceData.state.space_description || "",
      spaceDiscord: spaceData.state.external_links?.discord || undefined,
      spaceTelegram: spaceData.state.external_links?.telegram || undefined,
      spaceX: spaceData.state.external_links?.x || undefined,
      spaceLinkedIn: spaceData.state.external_links?.linkedIn || undefined,
      backgroundImg: spaceData.state.space_background || undefined,
      avatarImg: spaceData.state.space_logo || undefined,
    });
  }, [spaceData, reset, initEdit]);
  authGuard({
    navigate,
    user,
  });

  useEffect(() => {
    if (!unAuthAtlasSpace || !parsedSpacePrincipal) return;
    getAtlasSpace({
      spaceId: parsedSpacePrincipal.toString(),
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, spaceData, parsedSpacePrincipal]);

  const spaceName = watch("spaceName");
  const spaceDescription = watch("spaceDescription");
  const avatarImg = watch("avatarImg");
  const backgroundImg = watch("backgroundImg");

  const onSubmit: SubmitHandler<SpaceBuilderFormInput> = async (data) => {
    if (!authAtlasMain) {
      return;
    }

    const name = data.spaceName.trim();
    const description = data.spaceDescription.trim();
    const externalLinks = {
      x: data.spaceX ?? null,
      telegram: data.spaceTelegram ?? null,
      discord: data.spaceDiscord ?? null,
      linkedIn: data.spaceLinkedIn ?? null,
    };

    if (parsedSpacePrincipal) {
      if (!authAtlasSpace || !unAuthAtlasSpace) return;
      const editSpaceCall = editSpace({
        authAtlasSpace,
        name,
        description,
        logo: data.avatarImg ?? null,
        background: data.backgroundImg ?? null,
        externalLinks,
      });
      await toast.promise(editSpaceCall, {
        loading: "Updating space data...",
        success: "Space updated successfully",
        error: getErrorWithInfoToast("Failed to update space."),
      });
      await getAtlasSpace({
        spaceId: parsedSpacePrincipal.toString(),
        unAuthAtlasSpace,
        dispatch,
      });

      if (user?.principal && unAuthAtlasMain) {
        getAtlasUser({
          dispatch,
          userId: user.principal,
          unAuthAtlasMain: unAuthAtlasMain,
        });
      }
      navigate(getSpacePath(parsedSpacePrincipal));
    } else {
      const createSpaceCall = createNewSpace({
        authAtlasMain,
        name,
        description,
        symbol: null,
        logo: data.avatarImg ?? null,
        background: data.backgroundImg ?? null,
        externalLinks,
      });
      const space = await toast.promise(createSpaceCall, {
        loading: "Creating new space...",
        success: "Space created successfully",
        error: getErrorWithInfoToast("Failed to create space."),
      });
      if (user?.principal && unAuthAtlasMain) {
        getAtlasUser({
          dispatch,
          userId: user.principal,
          unAuthAtlasMain,
        });
      }
      navigate(getSpacePath(space.id));
    }
  };

  const handleDrop = async (
    files: File[],
    type: "avatarImg" | "backgroundImg"
  ) => {
    const file = files[0];
    if (!file || file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Max size is 5MB.");
      return;
    }

    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    const base64 = await imageCompression.getDataUrlFromFile(compressed);

    if (type === "avatarImg") {
      setValue("avatarImg", base64);
    } else {
      setValue("backgroundImg", base64);
    }

    clearErrors(type);
  };

  const didUserCanAdministrate =
    (parsedSpacePrincipal && userInfo?.canAdministrate(parsedSpacePrincipal)) ??
    false;
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="container mx-auto my-4 px-4 sm:px-6 md:px-8">
        <div className="w-full px-3">
          <div className="my-4 flex justify-end px-0 sm:px-3">
            {parsedSpacePrincipal ? (
              didUserCanAdministrate && <Button>Edit space</Button>
            ) : (
              <Button>Create space</Button>
            )}
          </div>
          <div className="relative w-full rounded-xl bg-[#1E0F33] mb-1">
            <div className="px-4 py-6 sm:px-8 sm:py-8">
              {parsedSpacePrincipal ? (
                <div className="rounded-2xl text-white font-montserrat font-semibold text-2xl sm:text-3xl my-4 text-center sm:text-left">
                  <h1>Edit space profile</h1>
                </div>
              ) : (
                <div className="rounded-2xl w-full mb-4 bg-cover bg-[url(/reward-bg-img.png)] font-montserrat [mix-blend-mode:luminosity] min-h-[6rem] sm:min-h-[10rem] flex flex-col justify-end">
                  <div className="rounded-2xl text-white font-montserrat font-semibold text-xl sm:text-2xl md:text-3xl m-4 sm:m-5">
                    <h1>Welcome to ATLAS!</h1>
                  </div>
                </div>
              )}
              <div className="relative">
                <Dropzone
                  options={{
                    accept: { "image/*": [] },
                    maxFiles: 1,
                    multiple: false,
                    onDrop: (files) => handleDrop(files, "backgroundImg"),
                  }}
                >
                  {!backgroundImg && (
                    <div className="bg-gradient-to-b from-[#493480] to-[#6C52BD] w-full h-40 sm:h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex items-center justify-center relative">
                      <div className="flex items-center justify-center">
                        <div className="text-xl text-white flex items-center justify-center gap-1 font-montserrat font-medium flex-col">
                          <RiGalleryUploadFill size={40} />
                          Cover Photo
                        </div>
                      </div>
                    </div>
                  )}
                  {backgroundImg && (
                    <div
                      className="w-full h-40 sm:h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex items-center justify-center relative"
                      style={
                        backgroundImg
                          ? {
                              backgroundImage: `url('${backgroundImg}')`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center justify-center">
                        <div className="text-xl text-white flex items-center justify-center gap-1 font-montserrat font-medium flex flex-col">
                          <RiGalleryUploadFill size={40} />
                          Change Cover Photo
                        </div>
                      </div>
                    </div>
                  )}
                </Dropzone>
              </div>
              <div className="flex flex-col sm:flex-row mt-4 items-center sm:items-start">
                <div
                  className={`${
                    !avatarImg
                      ? "bg-gradient-to-b from-[#493480] to-[#6C52BD]"
                      : `bg-white`
                  } flex rounded-3xl p-1 sm:p-0 w-32 h-32 sm:w-28 sm:h-28 flex-none mb-4 sm:mb-0 mr-1 sm:mr-4`}
                >
                  <div className="flex flex-1 items-center justify-center">
                    <Dropzone
                      options={{
                        accept: { "image/*": [] },
                        maxFiles: 1,
                        multiple: false,
                        onDrop: (files) => handleDrop(files, "avatarImg"),
                      }}
                    >
                      {avatarImg && (
                        <div className="relative">
                          <img
                            src={avatarImg as string}
                            draggable="false"
                            className={`rounded-2xl w-22 h-22 sm:w-28 sm:h-28 items-center ${
                              parsedSpacePrincipal ? "opacity-50" : ""
                            }`}
                          />
                          <div className="font-medium text-white absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-sm sm:text-base">
                            <RiGalleryUploadFill size={20} />
                          </div>
                        </div>
                      )}
                      {!avatarImg && (
                        <div className="rounded-3xl w-20 h-20 sm:w-28 sm:h-28 text-xs sm:text-sm text-white flex flex-col items-center justify-center gap-1 text-center font-montserrat font-medium">
                          <RiGalleryUploadFill size={32} />
                          Avatar
                        </div>
                      )}
                    </Dropzone>
                  </div>
                </div>
                <div className="my-1 text-white font-montserrat flex-1 w-full">
                  <div className="relative bg-[#9173FF]/20 mb-2 pt-8 pb-2 rounded-xl">
                    <p className="absolute left-4 top-2 text-base sm:text-xl">
                      Space name:
                    </p>
                    <input
                      {...register("spaceName")}
                      className="bg-transparent outline-none px-4 pb-4 font-medium w-full text-sm sm:text-lg"
                      placeholder="Space name"
                      maxLength={MAX_NAME_LEN}
                    />
                    <p className="text-red-500 mt-1 text-xs sm:text-sm">
                      {errors.spaceName?.message}
                    </p>
                    <p className="absolute right-4 bottom-2 text-xs">
                      {spaceName?.length ?? 0}/{MAX_NAME_LEN}
                    </p>
                  </div>
                  <div className="relative pt-8 pb-4 bg-[#9173FF]/20 rounded-xl">
                    <p className="absolute left-4 top-2 text-base sm:text-xl">
                      Bio:
                    </p>
                    <textarea
                      {...register("spaceDescription")}
                      className="bg-transparent outline-none px-4 pb-8 font-medium text-sm sm:text-lg w-full"
                      placeholder="Space bio"
                      maxLength={MAX_DESCRIPTION_LEN}
                    />
                    <p className="text-red-500 mt-1 text-xs sm:text-sm">
                      {errors.spaceDescription?.message}
                    </p>
                    <p className="absolute right-4 bottom-2 sm:bottom-4 text-xs">
                      {spaceDescription?.length ?? 0}/{MAX_DESCRIPTION_LEN}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 font-montserrat font-medium w-full text-white mt-1 sm:mt-2">
                    <div className="flex flex-col">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl flex-none">
                          <FaDiscord size={24} />
                        </div>
                        <input
                          {...register("spaceDiscord")}
                          className="p-2 bg-[#9173FF]/20 outline-none rounded-xl my-1 sm:my-2 w-full p-1 text-sm sm:text-base"
                          placeholder="Discord link"
                          maxLength={MAX_LINK_LEN}
                        />
                      </div>
                      <p className="text-red-500 mt-1 text-xs sm:text-sm">
                        {errors.spaceDiscord?.message}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl flex-none">
                          <FaTelegramPlane size={24} />
                        </div>
                        <input
                          {...register("spaceTelegram")}
                          className="p-2 bg-[#9173FF]/20 outline-none rounded-xl my-1 sm:my-2 w-full p-1 text-sm sm:text-base"
                          placeholder="Telegram link"
                          maxLength={MAX_LINK_LEN}
                        />
                      </div>
                      <p className="text-red-500 mt-1 text-xs sm:text-sm">
                        {errors.spaceTelegram?.message}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl flex-none">
                          <FaXTwitter size={24} />
                        </div>
                        <input
                          {...register("spaceX")}
                          className="p-2 bg-[#9173FF]/20 outline-none rounded-xl my-1 sm:my-2 w-full p-1 text-sm sm:text-base"
                          placeholder="Twitter link"
                          maxLength={MAX_LINK_LEN}
                        />
                      </div>
                      <p className="text-red-500 mt-1 text-xs sm:text-sm">
                        {errors.spaceX?.message}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex gap-2 items-center">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl flex-none">
                          <FaLinkedinIn size={24} />
                        </div>
                        <input
                          {...register("spaceLinkedIn")}
                          className="p-2 bg-[#9173FF]/20 outline-none rounded-xl my-1 sm:my-2 w-full p-1 text-sm sm:text-base"
                          placeholder="LinkedIn link"
                          maxLength={MAX_LINK_LEN}
                        />
                      </div>
                      <p className="text-red-500 mt-1 text-xs sm:text-sm">
                        {errors.spaceLinkedIn?.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SpaceBuilder;
