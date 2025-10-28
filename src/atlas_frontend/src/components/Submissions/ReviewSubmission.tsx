import React, { useState } from "react";
import type { _SERVICE } from "../../../../declarations/atlas_space/atlas_space.did";
import type { TaskData } from "../../canisters/atlasSpace/types";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import {
  acceptSubtaskSubmission,
  getSpaceTasks,
  rejectSubtaskSubmission
} from "../../canisters/atlasSpace/api";
import { Principal } from "@dfinity/principal";
import type { ActorSubclass } from "@dfinity/agent";
import toast from "react-hot-toast";
import { runWithLoading } from "../../utils/loading";
import Button from "../Shared/Button";

interface ReviewSubmissionProps {
  submission: TaskData;
  authAtlasSpace: ActorSubclass<_SERVICE>;
  taskId: string;
  subtaskId: string;
  unAuthAtlasSpace: ActorSubclass<_SERVICE>;
  spaceId: string;
  userPrincipal: string;
  onReviewComplete?: () => void;
}

interface SubtaskSubmission {
  authAtlasSpace: ActorSubclass<_SERVICE>;
  userPrincipal: Principal;
  taskId: bigint;
  subtaskId: bigint;
  reason: string | null;
}

const ReviewSubmission = ({
  submission,
  authAtlasSpace,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  spaceId,
  userPrincipal,
  onReviewComplete
}: ReviewSubmissionProps) => {
  const dispatch = useDispatch();
  const principal = Principal.from(userPrincipal);
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  
  const { register, handleSubmit } = useForm<SubtaskSubmission>();
  
  const onSubmit: SubmitHandler<SubtaskSubmission> = async (data) => {
    const rawReason = data.reason?.trim();
    const trimmedRawReason = !rawReason || rawReason === "" ? null : rawReason;
    
    await runWithLoading(
      async () => {
        await toast.promise(
          rejectSubtaskSubmission({
            authAtlasSpace,
            userPrincipal: principal,
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
        if (onReviewComplete) onReviewComplete();
      },
      dispatch,
      () => setShowRejectPopup(false)
    );
  };

  const [showRejectPopup, setShowRejectPopup] = useState(false);

  const acceptSubtask = async () => {
    await runWithLoading(async () => {
      await toast.promise(
        acceptSubtaskSubmission({
          authAtlasSpace,
          userPrincipal: principal,
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
      if (onReviewComplete) onReviewComplete();
    }, dispatch);
  };

  const singleSubmissionState = Object.keys(submission.submissionData.state)[0];
  
  if (singleSubmissionState !== "WaitingForReview") {
    return (
      <div className="mt-4 p-3 rounded-lg bg-dark/30">
        <div className="flex text-white font-medium justify-between">
          Status: <span className="font-semibold">{singleSubmissionState}</span>
        </div>
        {singleSubmissionState === "Rejected" &&
          submission.submissionData.rejection_reason[0] &&
          submission.submissionData.rejection_reason[0].trim().length > 0 && (
            <div className="mt-2 p-3 text-sm rounded border border-red-500 bg-red-800/30 text-red-300">
              <p className="font-semibold text-white mb-1">Reject Reason:</p>
              <p className="break-words">
                {submission.submissionData.rejection_reason[0]}
              </p>
            </div>
          )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="text-sm sm:text-base">
        <p className="text-white font-semibold mb-1">Submitted response:</p>
        {"Text" in submission.submissionData.submission && (
          <div className="border-2 border-dark/10 p-3 rounded w-full mb-4 bg-primary/20 text-white break-words">
            {submission.submissionData.submission.Text.content}
          </div>
        )}
        {"List" in submission.submissionData.submission && (
          <ul className="list-decimal list-inside border-2 border-dark/10 p-3 rounded-xl w-full mb-4 bg-primary/20 text-white space-y-1">
            {submission.submissionData.submission.List.items.map((item: string, idx: number) => (
              <li key={idx} className="break-words whitespace-pre-wrap">
                {item}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col justify-end gap-2">
          <div className="flex gap-2 justify-end">
            <Button
              onClick={acceptSubtask}
              className="px-4 font-medium"
            >
              Accept
            </Button>
            <Button
              onClick={() => setShowRejectPopup(true)}
              className="bg-red-500 px-4 font-medium"
            >
              Reject
            </Button>
          </div>
        </div>
      </div>
      
      {showRejectPopup && (
        <div
          className={`fixed inset-0 bg-black/30 flex items-center justify-center ${isLoading ? "z-30 blur-sm" : "z-50"}`}
        >
          <div className="bg-primary m-4 p-6 rounded-2xl shadow-lg w-96 text-black">
            <h2 className="text-xl text-white font-bold mb-4">
              Reason for Rejection
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="my-3 rounded-lg">
              <textarea
                {...register("reason")}
                className="w-full p-3 border outline-none focus:outline-none border-light/70 rounded-xl text-white mb-2 resize-none overflow-hidden"
                placeholder="Enter reason here (optional)"
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="dark"
                  onClick={() => {
                    setShowRejectPopup(false);
                  }}
                  className="px-2"
                >
                  Cancel
                </Button>
                <Button
                  variant="red"
                  onClick={handleSubmit(onSubmit)}
                  className="px-2"
                >
                  Submit Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmission;