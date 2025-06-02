import type { TaskType } from "../../../../../declarations/atlas_space/atlas_space.did";
import type { Principal } from "@dfinity/principal";
import React from "react";
import { useState } from "react";
import Button from "../../Shared/Button";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { submitSubtaskSubmission } from "../../../canisters/atlasSpace/api";
import toast from "react-hot-toast";
import { useAuthAtlasSpaceActor } from "../../../hooks/identityKit";
import { useAuth } from "@nfid/identitykit/react";
import DiscordButton from "../../DiscordButton";
import DiscordCheckButton from "../../DiscordCheckButton";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUserDiscordData, setUserDiscordAccessToken, setUserDiscordData } from "../../../store/slices/userSlice";
import { getOAuth2URL, getUserData } from "../../../integrations/discord";

type DiscordTaskType = Extract<TaskType, { DiscordTask: unknown }>['DiscordTask'];

const GUILD_ID = "1359198898752852110";

interface DiscordTaskProps {
  discordTask: DiscordTaskType;
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
}

interface DiscordTaskFormInput {
  taskSubmission: string;
}

const maxDescriptionLength = 500;

const schema = yup.object({
  taskSubmission: yup
    .string()
    .max(maxDescriptionLength)
    .trim()
    .min(2)
    .required()
    .label("Task submission"),
});

const DiscordTask = ({
  discordTask,
  spacePrincipal,
  taskId,
  subtaskId,
}: DiscordTaskProps) => {
  const { user } = useAuth();
  const [openSubmission, setSubmission] = useState(false);
  const { register, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      taskSubmission: "",
    },
  });
  const { connect } = useAuth();
  const authAtlasSpace = useAuthAtlasSpaceActor(spacePrincipal);

  const onSubmit: SubmitHandler<DiscordTaskFormInput> = async ({
    taskSubmission,
  }) => {
    console.log({ taskSubmission, authAtlasSpace });
    if (!authAtlasSpace) return;
    const call = submitSubtaskSubmission({
      authAtlasSpace,
      taskId: BigInt(taskId),
      subtaskId: BigInt(subtaskId),
      submission: { Text: { content: taskSubmission } },
    });
    await toast.promise(call, {
      loading: "Submitting response...",
      success: "Submitted response",
      error: "Failed to submit response",
    });

    setSubmission(false);
  };

  const userSubmission = user?.principal
    ? (discordTask.submission.find(
        ([principal]) => principal.toString() === user.principal.toString()
      ) ?? null)
    : null;

  const submissionState = userSubmission?.[1].state
    ? Object.keys(userSubmission?.[1].state)[0]
    : null;

  const dispatch = useDispatch();
  const { accessToken } = useSelector(selectUserDiscordData)
  console.log("Redux Discord accessToken:", accessToken);

  useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const { accessToken } = event.data as {accessToken?: string};
    if (accessToken) {
      dispatch(setUserDiscordAccessToken(accessToken));
      window.open("https://discord.gg/NMErQhPCGw", "_blank");
    }
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [dispatch]);

const handleDiscordCheck = async () => {
  if (!authAtlasSpace) {
    toast.error("Session expired");
    return;
  }
  if (!accessToken) {
    toast.error("Discord access token not found. Please connect your Discord account.");
    return;
  }

  const toastId = toast.loading("Checking Discord membership...");

  try {
    const isMember = await authAtlasSpace.verify_discord_token(
        BigInt(taskId),
        BigInt(subtaskId),
        accessToken,
        GUILD_ID
      );
      toast.dismiss(toastId);
      console.log("isMember raw:", isMember, typeof isMember);
    
    if (isMember && "Ok" in isMember && isMember.Ok === true) {
      toast.success("Discord membership verified!");
    } else {
      toast.error("You are NOT a member of the Discord server.");
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to verify Discord membership (exception)");
  }
};

  return (
    <div className="flex mt-2">
      <div className="flex flex-col mr-4">
        <div className="bg-[#1E0F33] p-1  w-[32px] h-[32px] rounded-lg relative">
          {submissionState === "WaitingForReview" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
          {submissionState === "Accepted" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
        </div>
        <div className="bg-[#1E0F33] flex-1 w-1 rounded-full mx-auto mt-2"></div>
      </div>
      <div className="bg-[#1E0F33] rounded-xl p-6 w-full">
        <div className="mb-4">
          <h4 className="text-xl font-medium font-poppins text-white mb-1">
            {discordTask.task_content.TitleAndDescription.task_title}
          </h4>
          <p className="text-zinc-400">
            {discordTask.task_content.TitleAndDescription.task_description}
          </p>
        </div>

        {user && !userSubmission && openSubmission && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-end flex gap-2">
              { !accessToken && (
              <DiscordButton/>)}
              { accessToken && (
              <DiscordCheckButton onCheck={handleDiscordCheck}/>)}
               
            </div>
          </form>
        )}
        {user && !userSubmission && !openSubmission && (
          <div className="flex">
            <Button onClick={() => setSubmission(true)}>Submit message</Button>
          </div>
        )}
        {!user && (
          <div className="flex">
            <Button onClick={() => connect()}>Connect</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordTask;