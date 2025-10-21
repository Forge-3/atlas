import React from "react";
import { useState } from "react";
import type {
  _SERVICE,
  TaskType,
} from "../../../../../declarations/atlas_space/atlas_space.did";
import Button from "../../Shared/Button";
import { useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  getRejectionInfo,
  getSpaceTasks,
  submitSubtaskSubmission,
} from "../../../canisters/atlasSpace/api";
import toast from "react-hot-toast";
import type { Principal } from "@dfinity/principal";
import { useAuthAtlasSpaceActor } from "../../../hooks/identityKit";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch } from "react-redux";
import type { ActorSubclass } from "@dfinity/agent";
import { getErrorWithInfoToast } from "../../../utils/errors";
import { runWithLoading } from "../../../utils/loading";
import { useTwitterAuth } from "../../../hooks/useTwitterAuth";

type TwitterTaskType = Extract<TaskType, { TwitterTask: unknown }>['TwitterTask'];

interface TwitterTaskProps {
  twitterTask: TwitterTaskType;
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
  unAuthAtlasSpace: ActorSubclass<_SERVICE> | null;
  isUserInHub: boolean
}

interface TwitterTaskFormInput {
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

const TwitterTask = ({
  twitterTask,
  spacePrincipal,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  isUserInHub
}: TwitterTaskProps) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { signIn } = useTwitterAuth();
  const [openSubmission, setSubmission] = useState(false);
  const { register, handleSubmit} = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      taskSubmission: "",
    },
  });
  const { connect } = useAuth();
  const authAtlasSpace = useAuthAtlasSpaceActor(spacePrincipal);

  const handleSubmitResponse: SubmitHandler<TwitterTaskFormInput> = async ({
    taskSubmission,
  }) => {
    if (!authAtlasSpace || !unAuthAtlasSpace) return;

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

      setSubmission(false);
      getSpaceTasks({
        spaceId: spacePrincipal.toString(),
        unAuthAtlasSpace,
        dispatch,
      });
    }, dispatch, () => setSubmission(false));
  };

  const [, submissionData] = user?.principal
    ? (twitterTask.submission.find(
        ([principal]) => principal.toString() === user.principal.toString()
      ) ?? [])
    : [];

  const currentSubmissionState = submissionData?.state
  ? Object.keys(submissionData?.state)[0]
  : null;

  const canSubmit = user && isUserInHub && (
  currentSubmissionState === null ||
  (currentSubmissionState === "Rejected" && ("TwitterTask" in twitterTask.task_content
     ? twitterTask.task_content.TwitterTask.allow_resubmit : "N/A"))
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

   return (
    <div className="flex mt-2">
      <div className="flex flex-col mr-4">
        <div className="bg-[#1E0F33] p-1 w-[32px] h-[32px] rounded-lg relative">
          {submissionState === "WaitingForReview" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative"/>
          )}
          {submissionState === "Accepted" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative"/>
          )}
        </div>
        <div className="bg-[#1E0F33] flex-1 w-1 rounded-full mx-auto mt-2"></div>
      </div>
      <div className="bg-[#1E0F33] rounded-xl p-3 md:p-6 w-full">
        <div className="mb-4">
           { 'TwitterTask' in twitterTask.task_content && (
             <>
              <h4 className="text-xl font-medium font-poppins text-white mb-1 text-wrap break-all">
                {twitterTask.task_content.TwitterTask.task_title}
              </h4>
              <p className="text-zinc-400 text-wrap break-all">
                {twitterTask.task_content.TwitterTask.task_description}
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
        {canSubmit && openSubmission && (
          <form onSubmit={handleSubmit(handleSubmitResponse)}>
            <div>
              <p className="text-xs md:text-base text-white font-semibold mb-1">Submit response:</p>
              <textarea
                {...register("taskSubmission")}
                className="border-2 border-[#9173FF]/20 p-2 h-32 md:h-20 md:p-4 rounded-xl w-full mb-2 bg-[#9173FF]/20 text-white"
              ></textarea>
            </div>
            <div>
                <Button onClick={signIn} className="w-half">
                    Sign in with X
                </Button>
            </div>
            <div className="flex justify-end">
              <Button className="text-[14px] px-2 py-1 rounded-xl">Submit</Button>
            </div>
          </form>
        )}
        {canSubmit  && !openSubmission && (
          <div className="flex py-2">
            <Button onClick={() => setSubmission(true)} className="text-[14px] px-2 py-1 rounded-xl">
              {submissionState === "Rejected" ? "Re-submit message" : "Submit message"}

            </Button>
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

export default TwitterTask;