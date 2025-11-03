import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  acceptSubtaskSubmission,
  fetch_x_post_likes,
  getSpaceTasks,
  rejectSubtaskSubmission,
} from "../../canisters/atlasSpace/api";
import type {
  _SERVICE,
  TaskType,
} from "../../../../declarations/atlas_space/atlas_space.did";
import type { UserSubmissions } from "../../canisters/atlasSpace/tasks";
import Button from "../Shared/Button";
import type { TaskData } from "../../canisters/atlasSpace/types";
import toast from "react-hot-toast";
import type { RootState } from "../../store/store";
import { useForm, type SubmitHandler } from "react-hook-form";
import { runWithLoading } from "../../utils/loading";
import { useTwitterAuth, type LikingUsersResponse } from "../../hooks/useTwitterAuth";

type GenericTaskType = Extract<TaskType, { GenericTask: unknown }>['GenericTask'];
type DiscordTaskType = Extract<TaskType, { DiscordTask: unknown }>['DiscordTask'];
type TwitterTaskType = Extract<TaskType, { TwitterTask: unknown }>['TwitterTask'];

export interface TaskSummationProps {
  task: GenericTaskType | DiscordTaskType | TwitterTaskType;
  usersSubmissions: UserSubmissions;
  submission: TaskData;
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: string;
  subtaskId: string;
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
  submissionState: "Rejected" | "WaitingForReview" | "Accepted";
  user: string;
}

interface SubtaskSubmission {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  taskId: bigint;
  subtaskId: bigint;
  reason: string | null;
}

const getDiscordAccountCreationDate = (userId: string): Date => {
  const discordEpoch = 1420070400000;
  const timestamp = (BigInt(userId) >> 22n) + BigInt(discordEpoch);
  return new Date(Number(timestamp));
};

const extractPostIdFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    const statusIndex = pathParts.indexOf('status');
    
    if (statusIndex !== -1 && pathParts.length > statusIndex + 1) {
      const postId = pathParts[statusIndex + 1];
      return postId.split('?')[0]; 
    }
    return null;
  } catch (error) {
    console.error("Invalid URL for parsing post ID:", error);
    return null;
  }
};

const TaskSummation = ({
  task,
  submission,
  authAtlasSpace,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  spaceId,
  submissionState,
  user,
}: TaskSummationProps) => {
  const dispatch = useDispatch();
  const userPrincipal = Principal.from(user);
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [loggingIn, setIsLoggingIn] = useState(false);
  const [loggedIn, setIsLoggedIn] = useState(false);
  const { signIn, accessToken } = useTwitterAuth();

  const { register, handleSubmit } = useForm<SubtaskSubmission>();
  const onSubmit: SubmitHandler<SubtaskSubmission> = async (data) => {
    const rawReason = data.reason?.trim();
    const trimmedRawReason = !rawReason || rawReason === "" ? null : rawReason;

    await runWithLoading(async () => {
      await toast.promise(
        rejectSubtaskSubmission({
          authAtlasSpace,
          userPrincipal,
          taskId: BigInt(taskId),
          subtaskId: BigInt(subtaskId),
          reason: trimmedRawReason,
        }),
        {
          loading: "Rejecting task...",
          error: "Failed to reject task.",
        }
      );
      setShowRejectPopup(false);
      await getSpaceTasks({
        spaceId,
        unAuthAtlasSpace,
        dispatch,
      });
    }, dispatch,
    () => setShowRejectPopup(false)
    );
  };

  const acceptSubtask = async () => {
    await runWithLoading(async () => {
      await toast.promise(
        acceptSubtaskSubmission({
          authAtlasSpace,
          userPrincipal,
          taskId: BigInt(taskId),
          subtaskId: BigInt(subtaskId),
        }),
        {
          loading: "Accepting task...",
          success: "Task accepted successfully.",
          error: "Failed to accept task.",
        }
      );
      await getSpaceTasks({
        spaceId,
        unAuthAtlasSpace,
        dispatch,
      });
    }, dispatch);
  };

  const handleXSignIn = async () => {
      await runWithLoading(async () => {
        setIsLoggingIn(true);
        setIsLoggedIn(false);
        await signIn();
      }, dispatch, () => 
        setIsLoggingIn(false));
        setIsLoggedIn(true);
    };

  const handleCheckPostLikes = async () => {
    if (!accessToken) {
      toast.error("You must be logged in to X to check post likes.");
      return;
    }

    if ("TwitterTask" in task.task_content) {
      const postUrl = task.task_content.TwitterTask.x_post_link;
      const postId = extractPostIdFromUrl(postUrl);
      if (!postId) {
        toast.error("Invalid X post link.");
        return;
      }
    
    await runWithLoading(async () => {
      let likesResponse: unknown;
      try {
        likesResponse = await fetch_x_post_likes({
          authAtlasSpace,
          accessToken,
          postId: postId,
        });
      } catch (error) {
        console.error("Error fetching post likes:", error);
        toast.error("Failed to fetch post likes. Please try again.");
        return;
      }

      try {
        const responseString: string =
          typeof likesResponse === "string" ? likesResponse : String(likesResponse);
        const parsedResponse: LikingUsersResponse = JSON.parse(responseString);
        
        if('Twitter' in submission.submissionData.submission) {
          const { x_user_id, x_name } = submission.submissionData.submission.Twitter
          const userFound = parsedResponse.data.some(likingUser => likingUser.id === x_user_id.toString() )
        if (userFound) {
          toast.success(`Verification Success: @${x_name} liked the post!`);
        } else {
          toast.error(`Verification Failed: @${x_name} did NOT like the post.`);
        }
        }
      } catch (error) {
        console.error("Error parsing likes response:", error);
        toast.error("Failed to parse post likes. Please try again.");
        return;
      }
      }, dispatch);
    }
  };

  const singleSubmissionState = Object.keys(submission.submissionData.state)[0];

  const renderTitleAndDescription = () => {
    if ('DiscordTask' in task.task_content) {
      return (
        <>
          <h3 className="text-xl font-bold text-wrap break-all">
            {task.task_content.DiscordTask.task_title}
          </h3>
          <p className="text-wrap break-all">
            {task.task_content.DiscordTask.task_description}
          </p>
        </>
      );
    }
    if ('TwitterTask' in task.task_content) {
      return (
        <>
          <h3 className="text-xl font-bold text-wrap break-all">
            {task.task_content.TwitterTask.task_title}
          </h3>
          <p className="text-wrap break-all">
            {task.task_content.TwitterTask.task_description}
          </p>
        </>
      );
    }
    if ('TitleAndDescription' in task.task_content) {
      return (
        <>
          <h3 className="text-xl font-bold text-wrap break-all">
            {task.task_content.TitleAndDescription.task_title}
          </h3>
          <p className="text-wrap break-all">
            {task.task_content.TitleAndDescription.task_description}
          </p>
        </>
      );
    }
    return null;
  };

  const renderSubmissionContent = () => {
    if ('Discord' in submission.submissionData.submission) {
      const { username, user_id } = submission.submissionData.submission.Discord;
      const creationDate = getDiscordAccountCreationDate(user_id.toString());
      return (
        <div>
            <div>
              <p>Username: {username}</p>
              <p>Account Creation Date: {creationDate.toLocaleDateString()}</p>
            </div>
        </div>
      );
    }
    if ('Twitter' in submission.submissionData.submission) {
      const { x_username, x_name, created_at} = submission.submissionData.submission.Twitter;
      const creationDate = new Date(created_at);
      return (
        <div>
            <div>
              <p>Username: @{x_username}</p>
              <p>Name: {x_name}</p>
              <p>Account Creation Date: {creationDate.toLocaleDateString()}</p>
              {!loggedIn && 
              <Button
                onClick={handleXSignIn}
                disabled={loggingIn}
                className="w-half"
                >
                Sign in with X
              </Button>
              }
              {loggedIn &&
              <Button
                onClick={handleCheckPostLikes}
                disabled={loggingIn}
                className="w-half"
                >
                Check X Post
              </Button>              
              }
            </div>
        </div>
      );
    }
    return <p>{submission.submissionData.submission.Text.content}</p>;
  };

  return (
    <div className="text-left pb-2 mt-2">
      {singleSubmissionState} {taskId} {subtaskId}
      {renderTitleAndDescription()}
      <div className="mt-4">
        <p className="text-white font-semibold mb-1">Submitted response:</p>
        <div className="border-2 border-[#9173FF]/20 p-2 rounded-xl w-full mb-4 bg-[#9173FF]/20 text-white">
          {renderSubmissionContent()}
        </div>
        {submissionState === "Rejected" &&
          submission.submissionData.rejection_reason[0] &&
          submission.submissionData.rejection_reason[0].trim().length > 0 && (
            <div className="mt-2 p-3 rounded-lg border border-red-500 bg-red-900 bg-opacity-20 text-red-300">
              <p className="font-semibold text-red-200 mb-1">Reject Reason:</p>
              <p className="break-words">
                {submission.submissionData.rejection_reason[0]}
              </p>
            </div>
          )}
      <div className="flex flex-col justify-end gap-2">
          {submissionState === "WaitingForReview" &&
            singleSubmissionState === "WaitingForReview" && (
              <>
                <div className="flex gap-2 justify-end">
                  <Button onClick={acceptSubtask}>Accept</Button>
                  <Button
                    onClick={() => setShowRejectPopup(true)}
                    className="bg-red-500"
                  >
                    Reject
                  </Button>
                </div>
              </>
            )}
        </div>
      </div>
      {showRejectPopup && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isLoading ? "z-30 blur-sm" : "z-50"}`}
        >
          <div className="bg-[#402a5f] p-6 rounded-2xl shadow-lg w-96 text-black">
            <h2 className="text-xl text-white font-bold mb-4">
              Reason for Rejection
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="my-3 rounded-lg">
              <textarea
                {...register("reason")}
                className="w-full p-3 border border-[#8973FF]/20 bg-[#9173FF]/20 rounded-xl text-white mb-2 resize-none overflow-hidden"
                placeholder="Enter reason here(optional)"
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setShowRejectPopup(false);
                  }}
                  className=""
                >
                  Cancel
                </Button>
                <Button className="bg-red-500">Submit Rejection</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskSummation;