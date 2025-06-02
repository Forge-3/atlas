import React, { useEffect, useState } from "react";
import { FiFilter, FiStar, FiUpload } from "react-icons/fi";
import Button from "../Shared/Button.tsx";
import Dropzone from "./Dropzone.tsx";
import type { DropzoneOptions } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  useAuthAtlasMainActor,
  useUnAuthAtlasMainActor,
} from "../../hooks/identityKit.ts";
import { createNewSpace, getAtlasUser } from "../../canisters/atlasMain/api.ts";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import { formatFormError } from "../../utils/errors.ts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch, useSelector } from "react-redux";
import { selectUserBlockchainData } from "../../store/slices/userSlice.ts";
import { getSpacePath } from "../../router/paths.ts";

interface SpaceBuilderFormInput {
  space_symbol?: string;
  space_name: string;
  space_description: string;
}

const schema = yup.object({
  space_symbol: yup.string().trim().max(16).optional(),
  space_description: yup.string().trim().max(128).min(3).required(),
  space_name: yup.string().max(32).trim().min(2).required(),
});

const SpaceBuilder = () => {
  const navigate = useNavigate();
  const [builderBackgroundImg, setBuilderBackgroundImg] = useState<
    null | string
  >(null);
  const [builderAvatarImg, setBuilderAvatarImg] = useState<null | string>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const userBlockchainData = useSelector(selectUserBlockchainData);
  const authAtlasMain = useAuthAtlasMainActor();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();

  useEffect(() => {
    if (errors.space_name?.message)
      toast.error(formatFormError(errors.space_name?.message));
    if (errors.space_description?.message)
      toast.error(formatFormError(errors.space_description?.message));
    if (errors.space_symbol?.message)
      toast.error(formatFormError(errors.space_symbol?.message));
  }, [errors]);

  const onSubmit: SubmitHandler<SpaceBuilderFormInput> = async (data) => {
    if (!authAtlasMain) {
      return;
    }
    const name = data.space_name.trim();
    const description = data.space_description.trim();
    const symbol =
      data.space_symbol !== "" && data.space_symbol ? data.space_symbol : null;
    const createSpaceCall = createNewSpace({
      authAtlasMain,
      name,
      description,
      symbol,
      logo: builderAvatarImg,
      background: builderBackgroundImg,
    });
    const space = await toast.promise(createSpaceCall, {
      loading: "Creating new space...",
      success: "Space created successfully",
      error: "Failed to create space",
    });
    if (user?.principal && unAuthAtlasMain) {
      getAtlasUser({
        dispatch,
        userId: user.principal,
        unAuthAtlasMain: unAuthAtlasMain,
      });
    }

    navigate(getSpacePath(space.id));
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
          <div className="mb-2 flex justify-end">
            <Button>Create space</Button>
          </div>
        )}
          <div className="relative w-full rounded-t-xl bg-[#1E0F33] mb-1">
            <div className="px-8 py-8">
              <div className="relative">
                {!builderBackgroundImg && (
                  <Dropzone
                    options={getDropzoneOptions(setBuilderBackgroundImg)}
                  >
                    <div className="bg-[#4A0295] border-2 border-dashed w-full h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex items-center justify-center relative">
                      <div className="flex items-center justify-center">
                        <div className="text-4xl font-semibold text-white flex items-center justify-center gap-2">
                          <FiUpload size={32} />
                          Upload background image
                        </div>
                      </div>
                    </div>
                  </Dropzone>
                )}
                {builderBackgroundImg && (
                  <div
                    className="w-full h-52 rounded-3xl bg-center bg-no-repeat bg-cover flex items-center justify-center relative"
                    style={
                      builderBackgroundImg
                        ? { backgroundImage: `url('${builderBackgroundImg}')` }
                        : {}
                    }
                  ></div>
                )}
                <div className="flex items-center justify-center gap-2 m-4 text-4xl text-white font-roboto absolute bottom-0 right-0">
                  <img src="/logos/icp-bold-uppercase.svg" draggable="false" />
                  <input
                    {...register("space_symbol")}
                    className="bg-[#4A0295] rounded-3xl px-4 py-2 border-2 border-dashed outline-none placeholder:text-white w-64"
                    placeholder="Symbol"
                  />
                </div>
              </div>

              <div className="flex mt-4">
                <div
                  className={`${
                    !builderAvatarImg
                      ? "bg-[#4A0295] border-2 border-dashed"
                      : `bg-white`
                  } flex rounded-3xl w-fit h-fit flex-none`}
                >
                  {builderAvatarImg && (
                    <img
                      src={builderAvatarImg}
                      draggable="false"
                      className="rounded-3xl m-[5px] w-28 h-28"
                    />
                  )}
                  {!builderAvatarImg && (
                    <Dropzone options={getDropzoneOptions(setBuilderAvatarImg)}>
                      <div className="rounded-3xl m-[5px] w-28 h-28 text-sm font-semibold text-white flex flex-col items-center justify-center gap-2 text-center">
                        <FiUpload size={24} />
                        Upload space avatar
                      </div>
                    </Dropzone>
                  )}
                </div>
                <div className="ml-4 my-1 text-white font-montserrat flex-1">
                  <input
                    {...register("space_name")}
                    className="bg-[#4A0295] rounded-3xl text-4xl font-semibold px-4 py-3 w-fit border-2 border-dashed mb-2 w-full outline-none placeholder:text-white"
                    placeholder="Space name"
                  />
                  <textarea
                    {...register("space_description")}
                    className="resize-none bg-[#4A0295] rounded-3xl px-4 py-2 w-fit border-2 border-dashed w-full outline-none placeholder:text-white"
                    placeholder="Space description"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="relative w-full bg-[#1E0F33] mb-1">
            <div className="flex px-8 py-6">
              <div className="flex gap-4">
                <Button className="flex gap-1">
                  <FiFilter /> Sorting
                </Button>
                <Button className="flex gap-1">
                  <FiStar /> Newest
                </Button>
              </div>
            </div>
          </div>
          <div className="relative w-full bg-[#1E0F33] rounded-b-xl">
            <div className="flex items-center justify-center px-4 py-8">
              <h3 className="text-white text-3xl font-semibold flex">
                You will find a quest here
              </h3>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SpaceBuilder;
