import React from "react";
import type {
  _SERVICE,
  TaskType,
} from "../../../../../declarations/atlas_space/atlas_space.did";
import type { Principal } from "@dfinity/principal";
import type { ActorSubclass } from "@dfinity/agent";
import { useDispatch } from "react-redux";
import { useAuth } from "@nfid/identitykit/react";
import toast from "react-hot-toast";
import { submitSubtaskSubmission, getSpaceTasks, getRejectionInfo} from "../../../canisters/atlasSpace/api";
import { useAuthAtlasSpaceActor } from "../../../hooks/identityKit";
import Button from "../../Shared/Button";
import { useDiscordUser } from "../../../hooks/useDiscordUser";
import { useDiscordAuth } from "../../../hooks/useDiscordAuth";
import { getErrorWithInfoToast } from "../../../utils/errors";
import { runWithLoading } from "../../../utils/loading";

type DiscordTaskType = Extract<TaskType, { DiscordTask: unknown }>['DiscordTask'];

interface DiscordTaskProps {
  discordTask: DiscordTaskType;
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
  unAuthAtlasSpace: ActorSubclass<_SERVICE> | null;
  isUserInHub: boolean;
}

const DiscordTask = ({
  discordTask,
  spacePrincipal,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  isUserInHub,
}: DiscordTaskProps) => {
  const dispatch = useDispatch();
  const { user, connect } = useAuth();
  const authAtlasSpace = useAuthAtlasSpaceActor(spacePrincipal);

  const { signIn, accessToken } = useDiscordAuth();
  const { isJoined, setIsJoined, joinServer, checkGuildMembership, discordUser } = useDiscordUser(spacePrincipal);

  const handleSubmit = async () => {
    const requiredGuildId = 'DiscordTask' in discordTask.task_content && discordTask.task_content.DiscordTask.guild_id;

    if (!requiredGuildId) {
      toast.error("Guild ID not found in task details.");
      return;
    }

    const isMember = await checkGuildMembership(requiredGuildId);

    if (isMember && authAtlasSpace) {
      const taskSubmission = `User: ${discordUser?.username} UserID: ${discordUser?.id}`;
      await runWithLoading(async () => {
        const call = submitSubtaskSubmission({
          authAtlasSpace,
          taskId: BigInt(taskId),
          subtaskId: BigInt(subtaskId),
          submission: { Text: { content: taskSubmission } },
        });

        await toast.promise(call, {
          loading: "Submitting response...",
          success: "Submitted response.",
          error: getErrorWithInfoToast("Failed to submit response."),
        });

        if (unAuthAtlasSpace) {
          getSpaceTasks({
            spaceId: spacePrincipal.toString(),
            unAuthAtlasSpace,
            dispatch,
          });
        }
      }, dispatch);
    }
  };

  const [, submissionData] = user?.principal
    ? (discordTask.submission.find(
        ([principal]) => principal.toString() === user.principal.toString()
      ) ?? [])
    : [];

  const currentSubmissionState = submissionData?.state
  ? Object.keys(submissionData?.state)[0]
  : null;

  const canSubmit = user && isUserInHub && (
  currentSubmissionState === null ||
  (currentSubmissionState === "Rejected" && ("DiscordTask" in discordTask.task_content
     ? discordTask.task_content.DiscordTask.allow_resubmit : "N/A"))
  );

  const rawState = Object.keys(submissionData?.state || {})[0] ?? null;
  
    const validStates = ["Rejected", "WaitingForReview", "Accepted"] as const;
    type SubmissionState = typeof validStates[number];
  
    const submissionState = validStates.includes(rawState as SubmissionState)
      ? (rawState as SubmissionState)
      : null;
  
    const { reasonText, showRejectionReason } = getRejectionInfo(
      submissionData ?? null,
      submissionState
    )

  const inviteLink = 'DiscordTask' in discordTask.task_content ? discordTask.task_content.DiscordTask.invite_link : undefined;
  
  return (
    <div className="flex mt-2">
      <div className="flex flex-col mr-4">
        <div className="bg-[#1E0F33] p-1 w-[32px] h-[32px] rounded-lg relative">
          {submissionState === "WaitingForReview" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
          {submissionState === "Accepted" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
        </div>
        <div className="bg-[#1E0F33] flex-1 w-1 rounded-full mx-auto mt-2"></div>
      </div>
      <div className="bg-[#1E0F33] rounded-xl p-3 md:p-6 w-full">
        <div className="mb-4">
            { 'DiscordTask' in discordTask.task_content && (
             <>
              <h4 className="text-xl font-medium font-poppins text-white mb-1 text-wrap break-all">
                {discordTask.task_content.DiscordTask.task_title}
              </h4>
              <p className="text-zinc-400 text-wrap break-all">
                {discordTask.task_content.DiscordTask.task_description}
              </p>
             </>
            )}
        </div>
        {showRejectionReason && (
            <div className="mt-2 p-3 rounded-lg border border-red-500 bg-red-900 bg-opacity-20 text-red-300">
              <p className="font-semibold text-red-200 mb-1">Rejected reason:</p>
              <p className="break-words">
                {reasonText}
              </p>
            </div>
          )}
        {canSubmit && !accessToken && (
          <Button onClick={signIn} className="w-half my-2">
            Sign in with Discord
          </Button>
        )}
        {canSubmit && accessToken && !isJoined && inviteLink && (
          <Button onClick={() => {
            joinServer(inviteLink);
            setIsJoined(true);
          }} className="w-half">
            Join Discord Server
          </Button>
        )}
        {canSubmit && accessToken && isJoined && (
          <Button onClick={handleSubmit} className="w-half">
            Submit Response
          </Button>
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
