import React, { useState } from "react";
import type {
  _SERVICE,
  TaskType,
} from "../../../../../declarations/atlas_space/atlas_space.did";
import type { Principal } from "@dfinity/principal";
import type { ActorSubclass } from "@dfinity/agent";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@nfid/identitykit/react";
import toast from "react-hot-toast";
import {
  submitSubtaskSubmission,
  getSpaceTasks,
  getRejectionInfo,
} from "../../../canisters/atlasSpace/api";
import Button from "../../Shared/Button";
import { useDiscordUser } from "../../../hooks/useDiscordUser";
import { useDiscordAuth } from "../../../hooks/useDiscordAuth";
import { getErrorWithInfoToast } from "../../../utils/errors";
import { runWithLoading } from "../../../utils/loading";
import { FaCaretRight } from "react-icons/fa6";
import { deserialize } from "../../../store/store";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../../store/slices/userSlice";
import ReviewSubmission from "../../Submissions/ReviewSubmission";
import { shortPrincipal } from "../../../utils/icp";
import { FiCopy } from "react-icons/fi";

type DiscordTaskType = Extract<
  TaskType,
  { DiscordTask: unknown }
>["DiscordTask"];

interface DiscordTaskProps {
  discordTask: DiscordTaskType;
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
  unAuthAtlasSpace: ActorSubclass<_SERVICE> | null;
  isUserInHub: boolean;
  authAtlasSpace: ActorSubclass<_SERVICE> | null;
  isAdmin?: boolean;
  disabled?: boolean;
}

const DiscordTask = ({
  discordTask,
  spacePrincipal,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  authAtlasSpace,
  isUserInHub,
  isAdmin = false,
  disabled = false,
}: DiscordTaskProps) => {
  const dispatch = useDispatch();
  const { user, connect } = useAuth();

  const { signIn, accessToken } = useDiscordAuth();
  const {
    isJoined,
    setIsJoined,
    joinServer,
    checkGuildMembership,
    discordUser,
  } = useDiscordUser(spacePrincipal);

  const [openReview, setOpenReview] = useState(false);

  const [, submissionData] = user?.principal
    ? discordTask.submission.find(
        ([p]) => p.toString() === user.principal.toString()
      ) ?? []
    : [];
  const allSubmissions = discordTask.submission;

  const currentSubmissionState = submissionData?.state
    ? Object.keys(submissionData.state)[0]
    : null;

  const canSubmit =
    user &&
    isUserInHub &&
    (currentSubmissionState === null ||
      (currentSubmissionState === "Rejected" &&
        ("DiscordTask" in discordTask.task_content
          ? discordTask.task_content.DiscordTask.allow_resubmit
          : false)));

  const rawState = Object.keys(submissionData?.state || {})[0] ?? null;
  const validStates = ["Rejected", "WaitingForReview", "Accepted"] as const;
  type SubmissionState = (typeof validStates)[number];

  const STATUS_LABELS: Record<typeof rawState, string> = {
    WaitingForReview: "Waiting for review",
    Accepted: "Accepted",
    Rejected: "Rejected",
  };

  const prettyStatus = STATUS_LABELS[rawState] ?? rawState;
  const submissionState = validStates.includes(rawState as SubmissionState)
    ? (rawState as SubmissionState)
    : null;

  const { reasonText, showRejectionReason } = getRejectionInfo(
    submissionData ?? null,
    submissionState
  );

  const inviteLink =
    "DiscordTask" in discordTask.task_content
      ? discordTask.task_content.DiscordTask.invite_link
      : undefined;

  const guildId =
    "DiscordTask" in discordTask.task_content
      ? discordTask.task_content.DiscordTask.guild_id
      : undefined;

  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;

  const isUserAdmin =
    isAdmin || (userInfo?.canAdministrate(spacePrincipal) ?? false);

  const copyPrincipal = (user: string) => {
    navigator.clipboard.writeText(user);
    toast.success("Copied full principal");
  };

  const handleSubmit = async () => {
    if (!authAtlasSpace) return;
    if (!guildId) {
      toast.error("Guild ID missing.");
      return;
    }

    const isMember = await checkGuildMembership(guildId);

    if (!isMember) {
      toast.error("You must join the Discord server first.");
      return;
    }

    await runWithLoading(async () => {
      const call = submitSubtaskSubmission({
        authAtlasSpace,
        taskId: BigInt(taskId),
        subtaskId: BigInt(subtaskId),
        submission: {
          Discord: {
            username: discordUser?.username ?? "",
            user_id: BigInt(discordUser?.id ?? "0"),
          },
        },
      });

      await toast.promise(call, {
        loading: "Submitting...",
        success: "Submitted successfully.",
        error: getErrorWithInfoToast("Failed to submit response."),
      });

      if (unAuthAtlasSpace) {
        await getSpaceTasks({
          spaceId: spacePrincipal.toString(),
          unAuthAtlasSpace,
          dispatch,
        });
      }
    }, dispatch);
  };

  const badgeCls = (s?: string) =>
    ({
      Accepted: "bg-green-500/20 text-green-300 border border-green-500/30",
      Rejected: "bg-red-500/20 text-red-300 border border-red-500/30",
      WaitingForReview: "bg-primary/20 border border-white/10",
    }[s ?? ""]);

  return (
    <div className="flex mt-8">
      <div className="flex flex-col mr-2 md:mr-8">
        <div className="bg-black/20 flex justify-center items-center w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] rounded-lg relative">
          {submissionState === "WaitingForReview" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
          {submissionState === "Accepted" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
        </div>
      </div>

      <div className="flex flex-col bg-black/20 rounded-lg p-3 md:p-6 w-full">
        <div className="mb-4">
          <div className="hidden sm:flex items-baseline gap-2">
            <h3 className="flex-1 text-[20px] md:text-h3 font-medium font-montserrat text-light break-all">
              {"DiscordTask" in discordTask.task_content
                ? discordTask.task_content.DiscordTask.task_title
                : "Discord Task"}
            </h3>
            {user && !isUserAdmin && submissionData && (
              <span
                className={`shrink-0 sm:ml-2 ${badgeCls(
                  rawState
                )} px-3 py-2 rounded-lg text-light`}
              >
                {prettyStatus}
              </span>
            )}
          </div>
          <p className="mt-1 text-[14px] md:text-base text-light/80 font-montserrat break-all">
            {"DiscordTask" in discordTask.task_content
              ? discordTask.task_content.DiscordTask.task_description
              : ""}
          </p>
        </div>

        {!user && (
          <div className="flex">
            <Button onClick={() => connect()}>Connect</Button>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-2">
          {canSubmit && !accessToken && (
            <Button
              onClick={signIn}
              disabled={disabled}
              className="text-[12px] md:text-base font-medium px-2 rounded-md"
            >
              Sign in with Discord
            </Button>
          )}
          {canSubmit && accessToken && !isJoined && inviteLink && (
            <Button
              onClick={() => {
                joinServer(inviteLink);
                setIsJoined(true);
              }}
              disabled={disabled}
              className="w-full md:w-auto mt-2"
            >
              Join Discord Server
            </Button>
          )}
        </div>

        {canSubmit && accessToken && isJoined && (
          <Button
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full md:w-auto mt-2"
          >
            Submit Response
          </Button>
        )}

        {showRejectionReason && (
          <div className="mt-4 p-3 rounded-lg border border-red-500 bg-red-800/30 text-red-300">
            <p className="font-semibold text-white mb-1">Reject Reason:</p>
            <p className="break-words">{reasonText}</p>
          </div>
        )}

        {isUserAdmin &&
          allSubmissions.length > 0 &&
          authAtlasSpace &&
          unAuthAtlasSpace && (
            <div className="pt-4 border-t border-white/20">
              <button
                className="flex text-[12px] sm:text-base text-white font-semibold mb-2"
                onClick={() => setOpenReview(!openReview)}
              >
                <FaCaretRight
                  className={`${openReview && `rotate-90`} mt-[5px] mr-1`}
                />{" "}
                Review Submissions ({allSubmissions.length})
              </button>
              {openReview && (
                <div className="space-y-4">
                  {allSubmissions.map(([principal, submissionData]) => {
                    const rowState = Object.keys(submissionData.state ?? {})[0];
                    return (
                      <div
                        key={principal.toString()}
                        className="border border-white/10 rounded-lg p-3"
                      >
                        <div className="flex flex-row justify-between mb-2">
                          <span
                            className="flex gap-2 py-1 text-white text-[12px] sm:text-base font-medium text-center cursor-pointer"
                            onClick={() => copyPrincipal(principal.toString())}
                          >
                            User: {shortPrincipal(principal.toString())}{" "}
                            <FiCopy className="my-1" />
                          </span>
                          <span
                            className={`text-xs sm:text-base font-medium w-fit ${badgeCls(
                              rowState
                            )} px-2 py-1 text-white rounded`}
                          >
                            {rowState}
                          </span>
                        </div>
                        <ReviewSubmission
                          submission={{
                            submissionData,
                            taskType: "DiscordTask" as keyof TaskType,
                          }}
                          authAtlasSpace={authAtlasSpace}
                          taskId={taskId}
                          subtaskId={subtaskId.toString()}
                          unAuthAtlasSpace={unAuthAtlasSpace}
                          spaceId={spacePrincipal.toString()}
                          userPrincipal={principal.toString()}
                          onReviewComplete={() => {
                            getSpaceTasks({
                              spaceId: spacePrincipal.toString(),
                              unAuthAtlasSpace,
                              dispatch,
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default DiscordTask;
