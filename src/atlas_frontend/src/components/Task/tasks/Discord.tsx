import type {
  TaskType,
  Submission as CandidSubmission
} from "../../../../../declarations/atlas_space/atlas_space.did";
import type { Principal } from "@dfinity/principal";
import React from "react";
import { useState, useEffect } from "react";
import Button from "../../Shared/Button";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { submitSubtaskSubmission } from "../../../canisters/atlasSpace/api";
import toast from "react-hot-toast";
import { useAuthAtlasSpaceActor } from "../../../hooks/identityKit";
import { useAuth } from "@nfid/identitykit/react";
import DiscordButton from "../../DiscordButton";
import { useDispatch, useSelector } from "react-redux";
import { selectUserDiscordData, setDiscordIntegrationData } from "../../../store/slices/userSlice";
import { unwrapCall } from "../../../canisters/delegatedCall";
import { getSpaceTasks } from "../../../canisters/atlasSpace/api";

const GUILD_ID = "1359198898752852110";

type Submission = CandidSubmission;

type DiscordTaskType = Extract<TaskType, { DiscordTask: unknown }>['DiscordTask'];

interface DiscordTaskProps {
  discordTask: DiscordTaskType;
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
}

interface DiscordTaskFormInput {
}

const schema = yup.object({});

const DiscordTask = ({
  discordTask,
  spacePrincipal,
  taskId,
  subtaskId,
}: DiscordTaskProps) => {
  console.log("DiscordTask component rendered with props:")
  const { user, connect } = useAuth();
  const actor = useAuthAtlasSpaceActor(spacePrincipal);
  const dispatch = useDispatch();

  const userDiscordData = useSelector(selectUserDiscordData);
  const accessToken = userDiscordData?.accessToken;

  const [openSubmission, setSubmission] = useState(false);

  const userSubmissionEntry = discordTask.submission.find(
    ([principal]) => principal.toText() === user?.principal.toText()
  );

  const submissionState = userSubmissionEntry ? userSubmissionEntry[1].state : null;

  const { handleSubmit, formState: { errors } } = useForm<DiscordTaskFormInput>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const { tokenType, accessToken, state, expiresIn } = event.data;

      if (tokenType && accessToken && state && expiresIn && user?.principal.toString() === state) {
        dispatch(setDiscordIntegrationData({
          tokenType,
          accessToken,
          state,
          expiresIn: parseInt(expiresIn, 10),
          guildId: GUILD_ID
        }));
        toast.success("Successfully connected to Discord!");
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [dispatch, user?.principal]);


  const onSubmit: SubmitHandler<DiscordTaskFormInput> = async () => {
    if (!actor) {
      toast.error("Actor not initialized.");
      return;
    }

    if (!user) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!accessToken) {
      toast.error("Please connect to Discord first by clicking 'Sign in with Discord'.");
      return;
    }

    const submission: Submission = {
      Discord: {
        access_token: accessToken,
        guild_id: GUILD_ID,
      },
    };

    try {
      const submissionPromise = submitSubtaskSubmission({
      authAtlasSpace: actor,
      taskId: BigInt(taskId),
      subtaskId: BigInt(subtaskId),
      submission: submission,
    });

     await unwrapCall<null>({
      call: submissionPromise,
      errMsg: "Failed to send subtask submission",
    });

    toast.success("Submission successful!");
    setSubmission(false);

    if (actor) {
        await getSpaceTasks({
          spaceId: spacePrincipal.toString(),
          unAuthAtlasSpace: actor,
          dispatch,
        });
        console.log("DiscordTask - getSpaceTasks dispatched after submission.");
      } else {
        console.warn("DiscordTask - Actor not available to refresh tasks after submission.");
      }

    } catch (e) {
      console.error("Error submitting task:", e);
      toast.error(`An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`);
    }
  
  };
  


  return (
    <div className="border border-gray-200 rounded-xl p-4 flex mb-2">
      <div className="flex flex-col items-center mr-4">
        <div className="bg-[#1E0F33] p-1 w-[32px] h-[32px] rounded-lg relative">
          {userSubmissionEntry && submissionState && (
            <>
              {'WaitingForReview' in submissionState && (
                <img src="/icons/hourglass.svg" className="w-6 h-6 relative" alt="Waiting for review" />
              )}
              {'Rejected' in submissionState && (
                <img src="/icons/x-in-box.svg" className="w-6 h-6 relative" alt="Rejected" />
              )}
              {'Accepted' in submissionState && (
                <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" alt="Accepted" />
              )}
            </>
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

        {user && !userSubmissionEntry && openSubmission && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-end flex gap-2">
              {!accessToken && (
                <DiscordButton />
              )}
              {accessToken && (
                <Button>Submit Discord Task</Button>
              )}
            </div>
          </form>
        )}
        {user && !userSubmissionEntry && !openSubmission && (
          <div className="flex">
            <Button onClick={() => setSubmission(true)}>Submit Discord Task</Button>
          </div>
        )}
        {!user && (
          <div className="flex">
            <Button onClick={() => connect()}>Connect</Button>
          </div>
        )}
        {userSubmissionEntry && submissionState && (
          <div className="flex">
            <Button>
              Task Submitted ({
                'WaitingForReview' in submissionState ? "Waiting for Review" :
                'Accepted' in submissionState ? "Accepted" :
                'Rejected' in submissionState ? "Rejected" : "Unknown"
              })
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordTask;