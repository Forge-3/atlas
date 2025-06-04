import type {
  TaskType,
  Submission as CandidSubmission
} from "../../../../../declarations/atlas_space/atlas_space.did";
import type { Principal } from "@dfinity/principal";
import React from "react";
import { useEffect } from "react";
import Button from "../../Shared/Button";
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

  const userSubmissionEntry = discordTask.submission.find(
    ([principal]) => principal.toText() === user?.principal.toText()
  );

  const submissionState = userSubmissionEntry ? userSubmissionEntry[1].state : null;

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const { accessToken: receivedAccessToken, tokenType, state, expiresIn } = event.data as { accessToken?: string; tokenType?: string; state?: string; expiresIn?: string; };

       if (receivedAccessToken) {
        const discordConnectToastId = toast.loading("Connecting to Discord...");

      try {
          dispatch(setDiscordIntegrationData({
            tokenType: tokenType || userDiscordData?.tokenType || "",
            accessToken: receivedAccessToken,
            state: state || user?.principal?.toString() || "",
            expiresIn: parseInt(expiresIn || "0", 10),
            guildId: GUILD_ID,
          }));

          toast.success("Successfully connected to Discord!", { id: discordConnectToastId });
          window.open("https://discord.gg/NMErQhPCGw", "_blank");

        } catch (e) {
          console.error("Failed to process Discord OAuth callback:", e);
          toast.error("Failed to connect to Discord. Please try again.", { id: discordConnectToastId });
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [dispatch, user?.principal, userDiscordData]);


  const onSubmit = async () => {
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

    const submissionToastId = toast.loading("Submitting Discord task and verifying membership..."); // Nowy toast dla submisji i weryfikacji

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

    toast.success("Submission successful! Discord membership verified.", { id: submissionToastId });

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
      let errorMessage = `An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`;
      if (typeof e === 'string' && e.includes("User is not a member of the guild")) { 
        errorMessage = "You are NOT a member of the required Discord server. Please join and try again.";
      }
      toast.error(errorMessage, { id: submissionToastId });
    }
  };
  
const renderButtons = () => {
    if (!user) {
      return (
        <div className="flex">
          <Button onClick={() => connect()}>Connect Wallet</Button>
        </div>
      );
    }

    if (userSubmissionEntry && submissionState) {
      return (
        <div className="flex">
          <Button disabled>
            Task Submitted ({
              'WaitingForReview' in submissionState ? "Waiting for Review" :
              'Accepted' in submissionState ? "Accepted" :
              'Rejected' in submissionState ? "Rejected" : "Unknown"
            })
          </Button>
        </div>
      );
    }

    if (!accessToken) {
      return (
        <div className="flex">
          <DiscordButton />
        </div>
      );
    }

    return (
        <div className="flex justify-end">
          <Button onClick={onSubmit}>Submit Discord Task</Button>
        </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 flex mb-2">
      <div className="flex flex-col items-center mr-4">
        <div className="bg-[#1E0F33] p-1 w-[32px] h-[32px] rounded-lg relative">
          {userSubmissionEntry && submissionState ? (
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
          ) : ( // Default icon, when there is no submission
            <img src="/icons/discord-icon.svg" alt="Discord Icon" className="w-6 h-6" />
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

        {renderButtons()}

      </div>
    </div>
  );
};

export default DiscordTask;