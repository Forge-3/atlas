import React, { useEffect, useState } from "react";
import Button from "../Shared/Button.tsx";
import Dropzone from "./Dropzone.tsx";
import type { DropzoneOptions } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  getUnAuthAtlasSpaceActor,
  useAuthAtlasMainActor,
  useAuthAtlasSpaceActor,
  useUnAuthAgent,
  useUnAuthAtlasMainActor,
} from "../../hooks/identityKit.ts";
import { createNewSpace, getAtlasUser } from "../../canisters/atlasMain/api.ts";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch, useSelector } from "react-redux";
import { selectUserBlockchainData } from "../../store/slices/userSlice.ts";
import { getSpacePath } from "../../router/paths.ts";
import { RiGalleryUploadFill } from "react-icons/ri";
import { FaDiscord, FaLinkedinIn, FaTelegramPlane } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { authGuard } from "../../hooks/guard.ts";
import { Principal } from "@dfinity/principal";
import type { RootState } from "../../store/store.ts";
import { editSpace, getAtlasSpace } from "../../canisters/atlasSpace/api.ts";

interface SpaceBuilderFormInput {
  spaceName: string;
  spaceDescription: string;
  spaceDiscord?: yup.Maybe<undefined | string>;
  spaceTelegram?: yup.Maybe<undefined | string>;
  spaceX?: yup.Maybe<undefined | string>;
  spaceLinkedIn?: yup.Maybe<undefined | string>;
}

const maxDescriptionLen = 128;
const maxNameLen = 32;

const schema = yup.object({
  spaceDescription: yup
    .string()
    .trim()
    .max(maxDescriptionLen)
    .min(3)
    .required()
    .label("Description"),
  spaceName: yup
    .string()
    .max(maxNameLen)
    .trim()
    .min(2)
    .required()
    .label("Name"),
  spaceDiscord: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid Discord URL")
    .matches(
      /^https:\/\/(www\.)?discord\.gg\/.+$/,
      "Must be a valid Discord invite link"
    )
    .notRequired(),

  spaceTelegram: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid Telegram URL")
    .matches(
      /^https:\/\/(t\.me|telegram\.me)\/.+$/,
      "Must be a valid Telegram link"
    )
    .notRequired(),

  spaceX: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid Twitter or X URL")
    .matches(
      /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]+\/?$/,
      "Must be a valid Twitter/X profile URL"
    )
    .notRequired(),

  spaceLinkedIn: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Enter a valid LinkedIn URL")
    .matches(
      /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[A-Za-z0-9_-]+\/?$/,
      "Must be a valid LinkedIn profile or company URL"
    )
    .notRequired(),
});

const SpaceBuilder = () => {
  const navigate = useNavigate();
  const { spacePrincipal } = useParams();
  const agent = useUnAuthAgent();
  const [builderBackgroundImg, setBuilderBackgroundImg] = useState<
    null | string
  >(null);
  const [builderAvatarImg, setBuilderAvatarImg] = useState<null | string>(null);
  const [initEdit, setInitEdit] = useState(false);

  const userBlockchainData = useSelector(selectUserBlockchainData);
  const authAtlasMain = useAuthAtlasMainActor();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const spaceData = spacePrincipal
    ? useSelector(
        (state: RootState) => state.spaces?.spaces?.[spacePrincipal] ?? null
      )
    : null;
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
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
  const authAtlasSpace = parsedSpacePrincipal
    ? useAuthAtlasSpaceActor(parsedSpacePrincipal)
    : null;
  useEffect(() => {
    if (!spaceData?.state || initEdit) return;
    setInitEdit(true);
    setBuilderBackgroundImg(spaceData.state.space_background);
    setBuilderAvatarImg(spaceData.state.space_logo);
    reset({
      spaceName: spaceData.state.space_name || "",
      spaceDescription: spaceData.state.space_description || "",
      spaceDiscord: spaceData.state.external_links?.discord || undefined,
      spaceTelegram: spaceData.state.external_links?.telegram || undefined,
      spaceX: spaceData.state.external_links?.x || undefined,
      spaceLinkedIn: spaceData.state.external_links?.linkedIn || undefined,
    });
  }, [spaceData, reset, initEdit]);
  authGuard({
    navigate,
    user,
  });

  useEffect(() => {
    if (!agent || spaceData || !parsedSpacePrincipal) return;
    const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(
      agent,
      parsedSpacePrincipal
    );
    getAtlasSpace({
      spaceId: parsedSpacePrincipal.toString(),
      unAuthAtlasSpace,
      dispatch,
    });
  }, [dispatch, agent, spaceData, parsedSpacePrincipal]);

  const spaceName = watch("spaceName");
  const spaceDescription = watch("spaceDescription");

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
      if (!authAtlasSpace) return;
      const editSpaceCall = editSpace({
        authAtlasSpace,
        name,
        description,
        logo: builderAvatarImg,
        background: builderBackgroundImg,
        externalLinks,
      });
      await toast.promise(editSpaceCall, {
        loading: "Updating space data...",
        success: "Space updated successfully",
        error: "Failed to update space",
      });
      navigate(getSpacePath(parsedSpacePrincipal));
    } else {
      const createSpaceCall = createNewSpace({
        authAtlasMain,
        name,
        description,
        symbol: null,
        logo: builderAvatarImg,
        background: builderBackgroundImg,
        externalLinks,
      });
      const space = await toast.promise(createSpaceCall, {
        loading: "Creating new space...",
        success: "Space created successfully",
        error: "Failed to create space",
      });
      navigate(getSpacePath(space.id));
    }
    if (user?.principal && unAuthAtlasMain) {
      getAtlasUser({
        dispatch,
        userId: user.principal,
        unAuthAtlasMain: unAuthAtlasMain,
      });
    }
  };

  const getDropzoneOptions = (
    setImg: React.Dispatch<React.SetStateAction<string | null>>
  ): DropzoneOptions => {
    return {
      maxFiles: 1,
      multiple: false,
      accept: { "image/*": [] },
      onDrop: async ([img]) => {
        const compressedFile = await imageCompression(img, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const base64File =
          await imageCompression.getDataUrlFromFile(compressedFile);
        setImg(base64File);
      },
    };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="container mx-auto my-4">
        <div className="w-full px-3">
          {user && userBlockchainData?.isSpaceLead() && (
            <div className="my-4 flex justify-end">
              {parsedSpacePrincipal ? (
                <Button>Edit space</Button>
              ) : (
                <Button>Create space</Button>
              )}
            </div>
          )}
          <div className="relative w-full rounded-xl bg-[#1E0F33] mb-1">
            <div className="px-8 py-8">
              {parsedSpacePrincipal ? (
                <div className="rounded-2xl text-white font-montserrat font-semibold text-3xl my-6">
                  <h1>Edit space profile</h1>
                </div>
              ) : (
                <div className="rounded-2xl w-full mb-6 bg-cover bg-[url(/reward-bg-img.png)] font-montserrat [mix-blend-mode:luminosity] min-h-[14rem] flex flex-col justify-end">
                  <div className="rounded-2xl text-white font-montserrat font-semibold text-3xl m-6">
                    <h1>Welcome to ATLAS!</h1>
                  </div>
                </div>
              )}
              <div className="relative">
                <Dropzone options={getDropzoneOptions(setBuilderBackgroundImg)}>
                  {!builderBackgroundImg && (
                    <div className="bg-gradient-to-b from-[#493480] to-[#6C52BD] w-full h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex items-center justify-center relative">
                      <div className="flex items-center justify-center">
                        <div className="text-2xl text-white flex items-center justify-center gap-1 font-montserrat font-medium flex flex-col">
                          <RiGalleryUploadFill size={48} />
                          Cover Photo
                        </div>
                      </div>
                    </div>
                  )}
                  {builderBackgroundImg && (
                    <div
                      className="w-full h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex items-center justify-center relative"
                      style={
                        builderBackgroundImg
                          ? {
                              backgroundImage: `url('${builderBackgroundImg}')`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center justify-center">
                        <div className="text-2xl text-white flex items-center justify-center gap-1 font-montserrat font-medium flex flex-col">
                          <RiGalleryUploadFill size={48} />
                          Change Cover Photo
                        </div>
                      </div>
                    </div>
                  )}
                </Dropzone>
              </div>

              <div className="flex mt-4">
                <div
                  className={`${
                    !builderAvatarImg
                      ? "bg-gradient-to-b from-[#493480] to-[#6C52BD]"
                      : `bg-white`
                  } flex rounded-3xl w-fit h-fit flex-none`}
                >
                  <Dropzone options={getDropzoneOptions(setBuilderAvatarImg)}>
                    {builderAvatarImg && (
                      <div className="relative">
                        <img
                          src={builderAvatarImg}
                          draggable="false"
                          className={`rounded-3xl m-[5px] w-28 h-28 ${
                            parsedSpacePrincipal ? "opacity-50" : ""
                          }`}
                        />
                        <div className="font-medium text-white absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                          <RiGalleryUploadFill size={48} />
                        </div>
                      </div>
                    )}
                    {!builderAvatarImg && (
                      <div className="rounded-3xl m-[5px] w-28 h-28 text-sm text-white flex flex-col items-center justify-center gap-1 text-center font-montserrat font-medium">
                        <RiGalleryUploadFill size={48} />
                        Avatar
                      </div>
                    )}
                  </Dropzone>
                </div>
                <div className="ml-4 my-1 text-white font-montserrat flex-1">
                  <div className="relative mb-2">
                    <p className="absolute left-4 top-2">Space name:</p>
                    <input
                      {...register("spaceName")}
                      className="bg-[#9173FF]/20 px-4 pt-8 pb-4  rounded-xl font-medium w-full text-xl"
                      placeholder="Space name"
                      maxLength={maxNameLen}
                    />
                    <p className="text-red-500 mt-1">
                      {errors.spaceName?.message}
                    </p>
                    <p className="absolute right-4 bottom-2 text-xs">
                      {spaceName?.length ?? 0}/{maxNameLen}
                    </p>
                  </div>
                  <div className="relative mb-2">
                    <p className="absolute left-4 top-2">Bio:</p>
                    <textarea
                      {...register("spaceDescription")}
                      className="bg-[#9173FF]/20 p-4 pt-8 rounded-xl font-medium w-full pb-4"
                      placeholder="Space bio"
                      maxLength={maxDescriptionLen}
                    />
                    <p className="text-red-500 mt-1">
                      {errors.spaceDescription?.message}
                    </p>
                    <p className="absolute right-4 bottom-4 text-xs">
                      {spaceDescription?.length ?? 0}/{maxDescriptionLen}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 font-montserrat font-medium">
                    <div className="flex flex-col">
                      <div className="flex gap-4">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl">
                          <FaDiscord size={36} />
                        </div>
                        <input
                          {...register("spaceDiscord")}
                          className="p-2 bg-[#9173FF]/20 rounded-xl my-2 w-full p-1 text-sm"
                          placeholder="Discord link"
                        />
                      </div>
                      <p className="text-red-500 mt-1">
                        {errors.spaceDiscord?.message}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex gap-4">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl">
                          <FaTelegramPlane size={36} />
                        </div>
                        <input
                          {...register("spaceTelegram")}
                          className="p-2 bg-[#9173FF]/20 rounded-xl my-2 w-full p-1 text-sm"
                          placeholder="Telegram link"
                        />
                      </div>
                      <p className="text-red-500 mt-1">
                        {errors.spaceTelegram?.message}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex gap-4">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl">
                          <FaXTwitter size={36} />
                        </div>
                        <input
                          {...register("spaceX")}
                          className="p-2 bg-[#9173FF]/20 rounded-xl my-2 w-full p-1 text-sm"
                          placeholder="Twitter link"
                        />
                      </div>
                      <p className="text-red-500 mt-1">
                        {errors.spaceX?.message}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex gap-4">
                        <div className="p-2 bg-[#9173FF]/20 rounded-xl">
                          <FaLinkedinIn size={36} />
                        </div>
                        <input
                          {...register("spaceLinkedIn")}
                          className="p-2 bg-[#9173FF]/20 rounded-xl my-2 w-full p-1 text-sm"
                          placeholder="LinkedIn link"
                        />
                      </div>
                      <p className="text-red-500 mt-1">
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
