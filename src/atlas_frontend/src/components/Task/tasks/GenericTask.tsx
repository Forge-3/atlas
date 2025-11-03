import React from "react";
import { useMemo, useState } from "react";
import type {
  _SERVICE,
  TaskType,
} from "../../../../../declarations/atlas_space/atlas_space.did";
import Button from "../../Shared/Button";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  getSpaceTasks,
  submitSubtaskSubmission,
} from "../../../canisters/atlasSpace/api";
import toast from "react-hot-toast";
import type { Principal } from "@dfinity/principal";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch, useSelector } from "react-redux";
import type { ActorSubclass } from "@dfinity/agent";
import { getErrorWithInfoToast } from "../../../utils/errors";
import { runWithLoading } from "../../../utils/loading";
import { deserialize } from "../../../store/store";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../../../store/slices/userSlice";
import ReviewSubmission from "../../Submissions/ReviewSubmission";
import { FaCaretRight } from "react-icons/fa6";
import { shortPrincipal } from "../../../utils/icp";
import { FiCopy } from "react-icons/fi";

interface GenericTaskProps {
  genericTask: TaskType["GenericTask"];
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
  unAuthAtlasSpace: ActorSubclass<_SERVICE> | null;
  isUserInHub: boolean;
  disabled?: boolean;
  authAtlasSpace: ActorSubclass<_SERVICE> | null;
  isAdmin?: boolean;
}

interface TextFormData {
  taskSubmission: string;
}

interface ListFormData {
  items: { value: string }[];
}

const GenericTask = ({
  genericTask,
  spacePrincipal,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
  isUserInHub,
  disabled = false,
  authAtlasSpace,
  isAdmin = false,
}: GenericTaskProps) => {
  const dispatch = useDispatch();
  const { user, connect } = useAuth();
  const [openSubmission, setSubmission] = useState(false);
  const answerFormatKey = "TitleAndDescription" in genericTask.task_content
    ? (Object.keys(genericTask.task_content.TitleAndDescription.answer_format)[0] as
        | "Small"
        | "Paragraph"
        | "Long"
        | "List")
    : null;

  const maxTextLength = useMemo(() => {
    switch (answerFormatKey) {
      case "Small":
        return 254;
      case "Paragraph":
        return 600;
      case "Long":
        return 2500;
      default:
        return 254;
    }
  }, [answerFormatKey]);

  const textSchema = yup.object({
    taskSubmission: yup
      .string()
      .trim()
      .min(2)
      .max(maxTextLength)
      .required("Field is required"),
  });

  const textForm = useForm<TextFormData>({
    resolver: yupResolver(textSchema),
    defaultValues: {
      taskSubmission: ""
    },
  });
  const [openReview, SetReview] = useState(false);
  
  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;
  const isUserAdmin = isAdmin || (userInfo?.canAdministrate(spacePrincipal) ?? false);

  const copyPrincipal = (user: string) => {
    navigator.clipboard.writeText(user);
    toast.success("Copied full principal");
  };

  const onSubmitText: SubmitHandler<TextFormData> = async ({ taskSubmission }) => {
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
      await getSpaceTasks({
        spaceId: spacePrincipal.toString(),
        unAuthAtlasSpace,
        dispatch,
      });
    }, dispatch, () => setSubmission(false));
  };

  const listSchema = yup.object({
  items: yup
    .array()
    .of(
      yup.object({
        value: yup
          .string()
          .trim()
          .max(254, "Item too long")
          .required("Item cannot be empty"),
      })
    )
    .max(25, "Max 25 items allowed")
    .required(),
});

const listForm = useForm<ListFormData>({
  resolver: yupResolver(listSchema),
  defaultValues: {
    items: [{ value: "" }]
  },
});

  const { fields, append, remove } = useFieldArray({
    control: listForm.control,
    name: "items",
  });

  const onSubmitList = async () => {
    if (!authAtlasSpace || !unAuthAtlasSpace) return;

    const items = listForm.getValues().items.map(item => item.value.trim());
    await runWithLoading(async () => {
      const call = submitSubtaskSubmission({
        authAtlasSpace,
        taskId: BigInt(taskId),
        subtaskId: BigInt(subtaskId),
        submission: { List: { items } },
      });
      await toast.promise(call, {
        loading: "Submitting list...",
        success: "Submitted response.",
        error: getErrorWithInfoToast("Failed to submit response."),
      });

      setSubmission(false);
      await getSpaceTasks({
        spaceId: spacePrincipal.toString(),
        unAuthAtlasSpace,
        dispatch,
      });
    }, dispatch, () => setSubmission(false));
  };

  const [, submissionData] = user?.principal
    ? (genericTask.submission.find(
        ([principal]) => principal.toString() === user.principal.toString()
      ) ?? [])
    : [];
  const allSubmissions = genericTask.submission;

  const currentSubmissionState = submissionData?.state
  ? Object.keys(submissionData?.state)[0]
  : null;

  const canSubmit = user && isUserInHub && (
  currentSubmissionState === null ||
  (currentSubmissionState === "Rejected" && genericTask.task_content.TitleAndDescription.allow_resubmit)
  );

  const rawState = Object.keys(submissionData?.state || {})[0] ?? null;
  const validStates = ["Rejected", "WaitingForReview", "Accepted"] as const;
  type SubmissionState = typeof validStates[number];

  const STATUS_LABELS: Record<typeof rawState, string> = {
    WaitingForReview: "Waiting for review",
    Accepted: "Accepted",
    Rejected: "Rejected",
  };

  const prettyStatus = STATUS_LABELS[rawState] ?? rawState;

  const submissionState = validStates.includes(rawState as SubmissionState)
    ? (rawState as SubmissionState)
    : null;
  
  const badgeCls = (s?: string) =>
  ({
    Accepted: "bg-green-500/20 text-green-300 border border-green-500/30",
    Rejected: "bg-red-500/20 text-red-300 border border-red-500/30",
    WaitingForReview: "bg-primary/20 border border-white/10",
  } as Record<string, string>)[s ?? ""];

  const userState = Object.keys(submissionData?.state ?? {})[0];

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

   return (
    <div className="flex mt-8">
      <div className="flex flex-col mr-2 md:mr-8">
        <div className="bg-black/20 flex justify-center items-center w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] rounded-lg relative">
          {submissionState === "WaitingForReview" && (
            <img src="/icons/check-in-box.svg" className="w-5 h-5 sm:w-6 sm:h-6 relative"/>
          )}
          {submissionState === "Accepted" && (
            <img src="/icons/check-in-box.svg" className="w-5 h-5 sm:w-6 sm:h-6 relative"/>
          )}
        </div>
      </div>
      <div className="flex flex-col bg-black/20 rounded-lg p-3 md:p-6 w-full">
        <div className="mb-4">
          <div className="hidden sm:flex items-baseline gap-2">
            <h3 className="flex-1 text-[20px] md:text-h3 font-medium font-montserrat text-light break-all">
              {"TitleAndDescription" in genericTask.task_content 
                ? genericTask.task_content.TitleAndDescription.task_title
                : "N/A"}
            </h3>
            {user && !isUserAdmin && submissionData && (
              <span className={`shrink-0 sm:ml-2 ${badgeCls(userState)} px-3 py-2 rounded-lg text-light`}>
                {prettyStatus}
              </span>
            )}
          </div>
          <div className="sm:hidden flex-col items-baseline">
            {user && !isUserAdmin && submissionData && (
              <div className="mb-3">
                <span className={`shrink-0 text-[12px] ${badgeCls(userState)} px-3 py-2 rounded-lg text-light`}>
                  {prettyStatus}
                </span>
              </div>
            )}
            <h3 className="flex-1 text-[20px] md:text-h3 font-medium font-montserrat text-light break-all">
              {"TitleAndDescription" in genericTask.task_content 
                ? genericTask.task_content.TitleAndDescription.task_title
                : "N/A"}
            </h3>
          </div>
          <p className="mt-1 text-[14px] md:text-base text-light/80 font-montserrat break-all">
            {"TitleAndDescription" in genericTask.task_content 
              ? genericTask.task_content.TitleAndDescription.task_description
              : "N/A"}
          </p>
        </div>

        {canSubmit && openSubmission && !disabled && (
          <>
            {answerFormatKey !== "List" ? (
               <form onSubmit={textForm.handleSubmit(onSubmitText)}>
                 <div>
                  <p className="flex flex-col w-full text-xs md:text-base text-light font-semibold mb-1">Submit response:</p>
                  <textarea
                    {...textForm.register("taskSubmission")}
                    className="border-2 border-primary/20 outline-none focus:outline-none resize-none overflow-hidden p-2 md:p-4 rounded-xl w-full max mb-2 bg-primary/20 text-light"
                    maxLength={maxTextLength}
                    onInput={(e) => resize(e.currentTarget)}
                  />
                  {textForm.formState.errors.taskSubmission && (
                    <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
                      {textForm.formState.errors.taskSubmission.message}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    {answerFormatKey && (
                      <span className="text-xs sm:text-sm bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">
                        {`Answer format: ${answerFormatKey} (max ${maxTextLength} chars)`}
                      </span>
                    )}
                    <Button variant="vivid" className="text-[12px] md:text-base font-medium px-2 rounded-md sm:mb-4">Submit</Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={listForm.handleSubmit(onSubmitList)}>
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex mb-2 items-center">
                    <span className="w-6 text-light font-bold">{idx + 1}.</span>
                    <input
                      {...listForm.register(`items.${idx}.value` as const)}
                      maxLength={maxTextLength}
                      className="border-2 border-primary/20 p-1 md:p-2 rounded-xl w-full bg-primary/20 text-light placeholder-gray-300 outline-none focus:outline-none"
                      defaultValue={field.value}
                    />
                    <button type="button" onClick={() => remove(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 text-xl font-bold cursor-pointer hover:bg-red-500/20 transition-colors">
                      −
                    </button>
                  </div>
                ))}
                {fields.length < 25 && (
                  <Button onClick={() => append({ value: "" })} className="w-5 h-5 md:w-8 md:h-8 flex items-center justify-center rounded-full text-light text-lg">
                    + 
                  </Button>
                )}
                {listForm.formState.errors.items && (
                  <p className="text-red-400 text-sm">{(listForm.formState.errors.items)?.message}</p>
                )}
                <div className="flex justify-between items-center mt-2">
                  {answerFormatKey && (
                    <span className="text-xs sm:text-sm bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">
                      {"Answer format: List (max 25 items)"}
                    </span>
                  )}
                  <Button variant="vivid" className="text-[12px] md:text-base font-medium px-2 rounded-md sm:mb-4">Submit</Button>
                </div>
              </form>
            )}
          </>
         )}
         
        {canSubmit  && !openSubmission && !disabled && (
          <div className="flex md:py-2">
            <Button onClick={() => setSubmission(true)} variant="vivid" className="text-[12px] md:text-base font-medium px-2 rounded-md">
              {submissionState === "Rejected" ? "Re-submit message" : "Submit message"}
            </Button>
          </div>
        )}
        {!user && (
          <div className="flex">
             <Button
               onClick={() => connect()}
               className="px-4"
             >
               Connect
             </Button>
          </div>
        )}
        {user && !isUserAdmin && submissionData && (
          Object.keys(submissionData.state)[0] === "Rejected" &&
          submissionData.rejection_reason[0] &&
          submissionData.rejection_reason[0].trim().length > 0 ? (
            <div className="border-t border-white/20">
              <div className="mt-2 p-3 text-sm rounded border border-red-500 bg-red-800/30 text-red-300">
                <p className="font-semibold text-white mb-1">Reject Reason:</p>
                <p className="break-words">
                  {submissionData.rejection_reason[0]}
                </p>
              </div>
            </div>
          ) : null
        )}
        {isUserAdmin && allSubmissions.length > 0 && authAtlasSpace && unAuthAtlasSpace && (
          <div className="pt-4 border-t border-white/20">
            <button className="flex text-[12px] sm:text-base text-white font-semibold mb-2"
            onClick={() => SetReview(!openReview)}
            >
              <FaCaretRight className={`${openReview && `rotate-90`} mt-[5px] mr-1`}/> Review Submissions ({allSubmissions.length})
            </button>
            {openReview && (
            <div className="space-y-4">
              {allSubmissions.map(([principal, submissionData]) => {
                const rowState = Object.keys(submissionData.state ?? {})[0];
                return (
                <div key={principal.toString()} className="border border-white/10 rounded-lg p-3">
                  <div className="flex flex-row justify-between mb-2">
                    <span className="flex gap-2 py-1 text-white text-[12px] sm:text-base font-medium text-center"
                    onClick={() => copyPrincipal(principal.toString())}
                    >
                      User: {shortPrincipal(principal.toString())} <FiCopy className="my-1"/></span>
                    <span className={`text-xs sm:text-base font-medium w-fit ${badgeCls(rowState)} px-2 py-1 text-white rounded`}>
                      {rowState}
                    </span>
                  </div>
                  <ReviewSubmission
                    submission={{
                      submissionData: submissionData,
                      taskType: "GenericTask"
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
        
        {isUserAdmin && allSubmissions.length === 0 && (
          <div className="pt-4 border-t border-white/20">
            <h4 className="text-white font-semibold mb-2">Review Submissions</h4>
            <p className="text-white/70">No submissions yet for this subtask.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericTask;
