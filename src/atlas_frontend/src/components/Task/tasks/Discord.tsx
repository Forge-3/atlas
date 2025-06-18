import type {
  TaskType,
  Submission as CandidSubmission,
} from "../../../../../declarations/atlas_space/atlas_space.did";
import type { Principal } from "@dfinity/principal";
import React, { useEffect, useCallback, useState } from "react";
import Button from "../../Shared/Button";
import { submitSubtaskSubmission } from "../../../canisters/atlasSpace/api";
import toast from "react-hot-toast";
import { useAuthAtlasSpaceActor } from "../../../hooks/identityKit";
import { useAuth } from "@nfid/identitykit/react";
import DiscordButton from "../../DiscordButton";
import { useDispatch, useSelector } from "react-redux";
import { 
  selectUserDiscordData,
  setDiscordIntegrationData, 
} from "../../../store/slices/userSlice"; 
import { getSpaceTasks } from "../../../canisters/atlasSpace/api";

type Submission = CandidSubmission;

type DiscordTaskData = Extract<TaskType, { DiscordTask: unknown }>['DiscordTask'];

interface DiscordTaskProps {
  discordTask: DiscordTaskData;
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
  console.log("DiscordTask component rendered with props:", { discordTask, spacePrincipal, taskId, subtaskId })
  const { user, connect } = useAuth();
  const actor = useAuthAtlasSpaceActor(spacePrincipal);
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const userDiscordData = useSelector(selectUserDiscordData);
  const accessToken = userDiscordData?.accessToken;

  const guildId = discordTask.guild_id;
  const discordInviteLink = discordTask.discord_invite_link;

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
          }));

          toast.success("Successfully connected to Discord!", { id: discordConnectToastId });

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

  console.log("callback things: ", accessToken, guildId, accessToken, spacePrincipal, user)

  const onSubmit = useCallback(async () => {
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

    if (!guildId) { 
      toast.error("Guild ID is missing for this Discord task. Please report this issue to space creator.");
      return;
    }

    const submission: Submission = {
      Discord: {
        access_token: accessToken,
        guild_id: guildId, 
      },
    };

     const submissionToastId = toast.loading("Submitting Discord task and verifying membership...");

  try {
   await submitSubtaskSubmission({
      authAtlasSpace: actor,
      taskId: BigInt(taskId),
      subtaskId: BigInt(subtaskId),
      submission,
    });

    toast.success("Submission successful! Discord membership verified.", { id: submissionToastId });

    await getSpaceTasks({
      spaceId: spacePrincipal.toString(),
      unAuthAtlasSpace: actor,
      dispatch,
    });

    console.log("DiscordTask - getSpaceTasks dispatched after submission.");

  } catch (e) {
    console.error("Error submitting task:", e);

    let errorMessage = "An unexpected error occurred. Please try again.";
    if (typeof e === 'object' && e !== null && 'IncorrectSubmission' in e) {
      const errorDetails = (e as { IncorrectSubmission: string }).IncorrectSubmission;
      if (typeof errorDetails === 'string' && errorDetails.includes("User is not a member of the guild")) {
        errorMessage = "You are NOT a member of the required Discord server. Please join and try again.";
        if (discordInviteLink) {
          errorMessage += ` Join here: ${discordInviteLink}`;
        }
      } else if (typeof errorDetails === 'string') {
        errorMessage = `Submission failed: ${errorDetails}`;
      }
    } else if (e instanceof Error) {
      errorMessage = `Submission failed: ${e.message}`;
    } else {
      errorMessage = `An unexpected error occurred: ${String(e)}`;
    }

    toast.error(errorMessage, { id: submissionToastId });
  }
}, [actor, user, accessToken, guildId, taskId, subtaskId, dispatch, spacePrincipal, discordInviteLink]);
  
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

    if (!guildId) { 
      return (
        <div className="flex">
          <Button disabled>Missing Guild ID for this task</Button>
        </div>
      );
    }
  };
  console.log("setVisible state:", isVisible);
  toast.dismiss(`discord-expired-${taskId}-${subtaskId}`)
  const handleJoinDiscord = () => {
    window.open(discordInviteLink, "_blank");
    setIsVisible(true);
    console.log("setVisible state:", isVisible);
  };
  
let taskTitle = "";
let taskDescription = "";

if ('TitleAndDescription' in discordTask.task_content) {
  taskTitle = discordTask.task_content.TitleAndDescription.task_title;
  taskDescription = discordTask.task_content.TitleAndDescription.task_description;
} else if ('Discord' in discordTask.task_content) {
  taskTitle = discordTask.task_content.Discord.task_title;
  taskDescription = discordTask.task_content.Discord.task_description;
} else {
  taskTitle = "Title is not accessible";
  taskDescription = "Description is not accessible";
}

  return (
    <div className="rounded-xl p-4 flex mb-2">
      <div className="flex flex-col items-center mr-4">
        <div className="bg-[#1E0F33] p-1 w-[32px] h-[32px] rounded-lg relative">
          
        </div>
        <div className="bg-[#1E0F33] flex-1 w-1 rounded-full mx-auto mt-2"></div>
      </div>
      <div className="bg-[#1E0F33] rounded-xl p-6 w-full">
        <div className="mb-4">
          <h4 className="text-xl font-medium font-poppins text-white mb-1">
            {taskTitle}
          </h4>
          <p className="text-zinc-400">
            {taskDescription}
          </p>
        </div>

        {!userSubmissionEntry && discordInviteLink && user && accessToken &&(
          <div className="flex justify-end" style={{paddingBottom: "5px"}}>
            <Button
              onClick={handleJoinDiscord}
              className={!isVisible ? "block" : "hidden"}
            >
              Join Discord Server
            </Button>
          </div>
        )}

        <div className="flex justify-end" style={{paddingRight: "5x"}}>
          <Button
            className={isVisible ? "block" : "hidden"}
            onClick={onSubmit}
          >
            Submit Discord Task
          </Button>
          {renderButtons()}
        </div>
      </div>
    </div>
  );
};

export default DiscordTask;