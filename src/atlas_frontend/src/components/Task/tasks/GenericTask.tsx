import React, { useMemo } from "react";
import { useState } from "react";
import type {
  _SERVICE,
  TaskType,
} from "../../../../../declarations/atlas_space/atlas_space.did";
import Button from "../../Shared/Button";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
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

interface GenericTaskProps {
  genericTask: TaskType["GenericTask"];
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
  unAuthAtlasSpace: ActorSubclass<_SERVICE> | null;
  isUserInHub: boolean;
  disabled?: boolean;
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
}: GenericTaskProps) => {
  const dispatch = useDispatch();
  const { user, connect } = useAuth();
  const [openSubmission, setSubmission] = useState(false);
  const authAtlasSpace = useAuthAtlasSpaceActor(spacePrincipal);
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
          <h4 className="text-xl font-medium font-poppins text-white mb-1 text-wrap break-all">
            {"TitleAndDescription" in genericTask.task_content 
              ? genericTask.task_content.TitleAndDescription.task_title
              : "N/A"}
          </h4>
          <p className="text-zinc-400 text-wrap break-all">
            {"TitleAndDescription" in genericTask.task_content 
              ? genericTask.task_content.TitleAndDescription.task_description
              : "N/A"}
          </p>
        </div>
        {showRejectionReason && (
            <div className="mt-2 p-3 rounded-lg border border-red-500 bg-red-900 bg-opacity-20 text-red-300">
              <p className="font-semibold text-red-200 mb-1">Rejected reason:</p>
              <p className="break-words">
                {reasonText}
              </p>
            </div>
          )}

        {canSubmit && openSubmission && !disabled && (
          <>
            {answerFormatKey !== "List" ? (
              <form onSubmit={textForm.handleSubmit(onSubmitText)}>
                <textarea
                  {...textForm.register("taskSubmission")}
                  maxLength={maxTextLength}
                  className="border-2 border-[#9173FF]/20 p-2 h-32 md:h-20 md:p-4 rounded-xl w-full mb-2 bg-[#9173FF]/20 text-white"
                />
                {textForm.formState.errors.taskSubmission && (
                  <p className="text-red-400 text-sm">
                    {textForm.formState.errors.taskSubmission.message}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button className="text-[14px] px-2 py-1 rounded-xl">Submit</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={listForm.handleSubmit(onSubmitList)}>
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2 mb-2 items-center">
                    <input
                      {...listForm.register(`items.${idx}.value` as const)}
                      maxLength={254}
                      className="border-2 border-[#9173FF]/20 p-1 md:p-2 rounded-xl w-full bg-[#9173FF]/20 text-white placeholder-gray-300"
                      defaultValue={field.value}
                    />
                    <button type="button" onClick={() => remove(idx)} className="text-red-500 text-xl px-2 py-1 rounded-lg">
                      −
                    </button>
                  </div>
                ))}
                {
                  <Button onClick={() => append({ value: "" })} className="md:px-2.5 md:py-1 px-2 py-0.5">
                    + 
                  </Button>
                }
                {listForm.formState.errors.items && (
                  <p className="text-red-400 text-sm">{(listForm.formState.errors.items)?.message}</p>
                )}
                <div className="flex justify-end">
                  <Button className="text-[14px] px-2 py-1 rounded-xl">Submit</Button>
                </div>
              </form>
            )}
          </>
         )}
         
        {canSubmit  && !openSubmission && !disabled && (
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

export default GenericTask;
