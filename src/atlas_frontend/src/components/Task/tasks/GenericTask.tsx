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
  getSpaceTasks,
  submitSubtaskSubmission,
} from "../../../canisters/atlasSpace/api";
import toast from "react-hot-toast";
import type { Principal } from "@dfinity/principal";
import { useAuthAtlasSpaceActor } from "../../../hooks/identityKit";
import { useAuth } from "@nfid/identitykit/react";
import { useDispatch } from "react-redux";
import type { ActorSubclass } from "@dfinity/agent";

interface GenericTaskProps {
  genericTask: TaskType["GenericTask"];
  spacePrincipal: Principal;
  taskId: string;
  subtaskId: number;
  unAuthAtlasSpace: ActorSubclass<_SERVICE> | null;
}

interface GenericTaskFormInput {
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

const GenericTask = ({
  genericTask,
  spacePrincipal,
  taskId,
  subtaskId,
  unAuthAtlasSpace,
}: GenericTaskProps) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [openSubmission, setSubmission] = useState(false);
  const { register, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      taskSubmission: "",
    },
  });
  const { connect } = useAuth();
  const authAtlasSpace = useAuthAtlasSpaceActor(spacePrincipal);

  const onSubmit: SubmitHandler<GenericTaskFormInput> = async ({
    taskSubmission,
  }) => {
    if (!authAtlasSpace || !unAuthAtlasSpace) return;
    const call = submitSubtaskSubmission({
      authAtlasSpace,
      taskId: BigInt(taskId),
      subtaskId: BigInt(subtaskId),
      submission: { Text: { content: taskSubmission } },
    });
    await toast.promise(call, {
      loading: "Submitting response...",
      success: "Submitted response",
      error: "Failed to submit response",
    });

    setSubmission(false);
    getSpaceTasks({
      spaceId: spacePrincipal.toString(),
      unAuthAtlasSpace,
      dispatch,
    });
  };

  const userSubmission = user?.principal
    ? (genericTask.submission.find(
        ([principal]) => principal.toString() === user.principal.toString()
      ) ?? null)
    : null;

  const submissionState = userSubmission?.[1].state
    ? Object.keys(userSubmission?.[1].state)[0]
    : null;
  return (
    <div className="flex mt-2">
      <div className="flex flex-col mr-4">
        <div className="bg-[#1E0F33] p-1  w-[32px] h-[32px] rounded-lg relative">
          {submissionState === "WaitingForReview" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
          {submissionState === "Accepted" && (
            <img src="/icons/check-in-box.svg" className="w-6 h-6 relative" />
          )}
        </div>
        <div className="bg-[#1E0F33] flex-1 w-1 rounded-full mx-auto mt-2"></div>
      </div>
      <div className="bg-[#1E0F33] rounded-xl p-6 w-full">
        <div className="mb-4">
          <h4 className="text-xl font-medium font-poppins text-white mb-1 text-wrap break-all">
            {genericTask.task_content.TitleAndDescription.task_title}
          </h4>
          <p className="text-zinc-400 text-wrap break-all">
            {genericTask.task_content.TitleAndDescription.task_description}
          </p>
        </div>

        {user && !userSubmission && openSubmission && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <p className="text-white font-semibold mb-1">Submit response:</p>
              <textarea
                {...register("taskSubmission")}
                className="border-2 border-[#9173FF]/20 p-2 rounded-xl w-full mb-4 bg-[#9173FF]/20 text-white"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <Button>Submit</Button>
            </div>
          </form>
        )}
        {user && !userSubmission && !openSubmission && (
          <div className="flex">
            <Button onClick={() => setSubmission(true)}>Submit message</Button>
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
