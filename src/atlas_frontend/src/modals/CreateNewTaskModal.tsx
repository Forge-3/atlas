import React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import Button from "../components/Shared/Button";
import * as yup from "yup";
import { FiPlus } from "react-icons/fi";
import DecimalInputForm from "../components/Shared/DecimalInputForm";
import { formatUnits, parseUnits } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { DECIMALS } from "../canisters/ckUsdcLedger/constans";
import GenericTask from "./tasks/GenericTask";
import NumericInputForm from "../components/Shared/NumericInputForm";
import { createNewTask, editTask, getSpaceTasks } from "../canisters/atlasSpace/api";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useAuthAtlasSpaceActor,
  useAuthCkUsdcLedgerActor,
  useUnAuthCkUsdcLedgerActor,
} from "../hooks/identityKit";
import { useSpaceId } from "../hooks/space";
import toast from "react-hot-toast";
import {
  getUserBalance,
  setUserSpaceAllowanceIfNeeded,
} from "../canisters/ckUsdcLedger/api";
import { useAuth } from "@nfid/identitykit/react";
import {
  selectBlockchainConfig,
  type StorableConfig,
} from "../store/slices/appSlice";
import { deserialize, type RootState } from "../store/store";
import { getErrorWithInfoToast } from "../utils/errors";
import { toLocalISOString } from "../utils/date";
import type { Task } from "../../../declarations/atlas_space/atlas_space.did";
import { mapTaskToForm } from "../utils/taskFormMapper";
import type { AnswerFormat } from "../../../declarations/atlas_space/atlas_space.did";
import { sortKeys } from "../utils/sort";

export const getAnswerFormatKey = (format: AnswerFormat): string => Object.keys(format)[0];
const answerFormatDescriptions: Record<string, string> = {
  Small: "Up to 254 characters",
  Paragraph: "Up to 600 characters",
  Long: "Up to 2500 characters",
  List: "Multiple items, each up to 254 characters",
};

type TaskType = "generic";
const allowedTaskTypes = ["generic"] as const;

interface CreateNewTaskFormInput {
  numberOfUses: number;
  rewardPerUsage: number;
  taskTitle: string;
  startTime: string;
  endTime: string;
  tasks: ({
    taskType: TaskType;
    title: string;
    description: string;
    allowResubmit: boolean;
    answerFormat: keyof typeof answerFormatDescriptions;
  } | { disabled: boolean })[];
}

type GenericTaskError = {
  allowResubmit?: { message: string };
};

const maxSubtitleLength = 50;
const maxTitleLength = 50;
const maxDescriptionLength = 500;
const answerFormats: AnswerFormat[] = [
  { Small: null },
  { Paragraph: null },
  { Long: null },
  { List: null },
];
const answerFormatKeys = Object.keys(answerFormatDescriptions) as Array<
  keyof typeof answerFormatDescriptions
>;

const taskSchema = yup.object({
  taskType: yup.mixed<TaskType>().oneOf(allowedTaskTypes).required(),
  title: yup
    .string()
    .trim()
    .max(maxSubtitleLength)
    .required()
    .label("Task title"),
  description: yup
    .string()
    .max(maxDescriptionLength)
    .trim()
    .min(2)
    .required()
    .label("Task description"),
  allowResubmit: yup.boolean().required(),
  answerFormat: yup
    .string()
    .oneOf(answerFormatKeys as string[])
    .required()
    .label("Answer format"),
});

const taskOrDisabledSchema = yup.lazy((value) => {
  if (value && "disabled" in value) {
    return yup.object({
      disabled: yup.boolean().required(),
    });
  }
  return taskSchema;
});

export interface EditableTask extends Task {
  task_id: bigint;
}

interface CreateNewTaskModalArgs {
  callback: () => void;
  taskToEdit: EditableTask | null; 
}

const CreateNewTaskModal = ({ callback, taskToEdit }: CreateNewTaskModalArgs) => {
  const renderedAt = new Date();
  const schema = yup.object({
    taskTitle: yup
      .string()
      .trim()
      .max(maxTitleLength)
      .required()
      .label("Task title"),
    numberOfUses: yup
      .number()
      .typeError("Number of usages must be a number")
      .min(1)
      .integer()
      .required()
      .label("Number of usages"),
    rewardPerUsage: yup
      .number()
      .typeError("Reward per user must be a number")
      .min(0.1)
      .required()
      .label("Reward per user"),
    startTime: yup
      .string()
      .required()
      .label("Start time")
      .test(
        "is-after-now",
        "Start time must be in the future",
        function (value) {
          if (taskToEdit) return true;
          return (
            new Date(value).getTime() >=
            new Date(renderedAt.toISOString().slice(0, 16)).getTime()
          );
        }
    ),
    endTime: yup
      .string()
      .required()
      .label("End time")
      .test(
        "is-after-start",
        "End time must be after start time",
        function (value) {
          const { startTime } = this.parent;
          return new Date(value).getTime() > new Date(startTime).getTime();
        }
      )
      .test("is-after-now", "End time must be in the future", function (value) {
        return new Date(value).getTime() > Date.now();
      }),
    tasks: yup
      .array()
      .of(taskOrDisabledSchema)
      .min(1)
      .required(),
  });

  const { spacePrincipal } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => state.app.isLoading);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateNewTaskFormInput>({
    resolver: yupResolver(schema),
    defaultValues: taskToEdit
    ? mapTaskToForm(taskToEdit)
    : {
        numberOfUses: 1,
        rewardPerUsage: 0.1,
        taskTitle: "",
        startTime: toLocalISOString(renderedAt),
        tasks: [
          {
            taskType: "generic",
            title: "",
            description: "",
            allowResubmit: false,
            answerFormat: "Small",
        },
        ],
      },
  });

  const { fields, append } = useFieldArray({
    control,
    name: "tasks",
  });
  const principal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  const { user } = useAuth();
  if (!principal) return <></>;
  const spaceId = principal.toString();

  const authAtlasSpaceActor = useAuthAtlasSpaceActor(principal);
  const unAuthCkUsdcActor = useUnAuthCkUsdcLedgerActor();
  const authCkUsdcActor = useAuthCkUsdcLedgerActor();

  const blockchainConfig = deserialize<StorableConfig>(
    useSelector(selectBlockchainConfig)
  );

  const calculateDepositAmount = (amount: bigint, fee: bigint, numberOfUses: bigint) => {
    return amount * numberOfUses + fee * numberOfUses + fee;
  };

  const ckUsdcFee = blockchainConfig
    ? (blockchainConfig.ckusdc_ledger.fee ?? 0n)
    : 0n;

  const numberOfUses = watch("numberOfUses");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rewardPerUsage = watch("rewardPerUsage" as any);

  const numberOfUsesNormalized = isNaN(numberOfUses) ? 0 : numberOfUses;
  const rewardPerUsageNormalized =
    isNaN(rewardPerUsage) || rewardPerUsage === "" ? 0 : rewardPerUsage;

  const rewardPerUsageBn = parseUnits(
    rewardPerUsageNormalized.toString(),
    DECIMALS
  );
  const numberOfUsesBn = BigInt(numberOfUsesNormalized);
  const estimatedCost = calculateDepositAmount(rewardPerUsageBn, ckUsdcFee, numberOfUsesBn);

  const hasAnySubmissions = !!taskToEdit && taskToEdit.tasks.some(t => {
    if ("GenericTask" in t) {
      return t.GenericTask.submission.length > 0;
    }
    return false;
  });

  const onSubmit: SubmitHandler<CreateNewTaskFormInput> = async ({
    numberOfUses,
    rewardPerUsage,
    tasks,
    startTime,
    endTime,
    taskTitle,
  }) => {
    const numberOfUsesBn = BigInt(numberOfUses.toString());
    const rewardPerUsageBn = parseUnits(rewardPerUsage.toString(), DECIMALS);

    const startTimeUnixSec = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimeUnixSec = Math.floor(new Date(endTime).getTime() / 1000);

    if (
      !authAtlasSpaceActor ||
      !unAuthCkUsdcActor ||
      !authCkUsdcActor ||
      !user
    ) {
      toast.error("Session expired");
      navigate("/");
      return;
    }

    const toAnswerFormat = (key: string): AnswerFormat => {
      switch (key) {
        case "Small":
          return { Small: null };
        case "Paragraph":
          return { Paragraph: null };
        case "Long":
          return { Long: null };
        case "List":
          return { List: null };
        default:
          throw new Error(`Unknown AnswerFormat key: ${key}`);
      }
    };

    const taskContent = tasks.map((task) => {
      if ("disabled" in task) {
        return null;
      }
      return {
        task_type: "generic",
        title: task.title,
        description: task.description,
        allow_resubmit: task.allowResubmit,
        answer_format: toAnswerFormat(task.answerFormat),
      };
    });

    if (!taskContent || taskContent.length === 0) {
      toast.error("Invalid subtasks: the minimum number of subtasks is one.");
      return;
    }

    let taskId: bigint;
    if (taskToEdit) {
      const oldTaskData = {
        task_title: taskToEdit.task_title,
        start_time: taskToEdit.start_time.toString(),
        end_time: taskToEdit.end_time.toString(),
        number_of_uses: taskToEdit.number_of_uses.toString(),
        token_reward: taskToEdit.token_reward.CkUsdc.amount.toString(),
        tasks: taskToEdit.tasks
          .map(t => {
            if ("GenericTask" in t) {
              return {
                task_content: t.GenericTask.task_content.TitleAndDescription,
              };
            }
            return null;
          })
          .filter(Boolean),
      };

      const newTaskData = {
        task_title: taskTitle,
        start_time: startTimeUnixSec.toString(),
        end_time: endTimeUnixSec.toString(),
        number_of_uses: numberOfUsesBn.toString(),
        token_reward: rewardPerUsageBn.toString(),
        tasks: taskContent.map(task => 
          task
            ? {
                task_content: {
                  task_description: task.description,
                  task_title: task.title,
                  allow_resubmit: task.allow_resubmit,
                  answer_format: task.answer_format,
                },
              }
            : null
        ),
      };

      const isSameTask = JSON.stringify(sortKeys(oldTaskData)) === JSON.stringify(sortKeys(newTaskData));
      if (isSameTask) {
        toast.success("No changes detected, task not updated.");
        callback();
        return;
      }

      const currentDepositAndFee = calculateDepositAmount(
        taskToEdit.token_reward.CkUsdc.amount,
        BigInt(ckUsdcFee),
        BigInt(taskToEdit.number_of_uses)
      );

      const newDepositAndFee = calculateDepositAmount(
        rewardPerUsageBn,
        BigInt(ckUsdcFee),
        numberOfUsesBn
      );

      if (newDepositAndFee > currentDepositAndFee) {
        const extraCost = newDepositAndFee - currentDepositAndFee + BigInt(ckUsdcFee);
        const allowanceCheck = setUserSpaceAllowanceIfNeeded({
          unAuthCkUsd: unAuthCkUsdcActor,
          authCkUsdc: authCkUsdcActor,
          spacePrincipal: principal,
          amount: extraCost,
          userPrincipal: user.principal,
        });
        await toast.promise(allowanceCheck, {
          loading: "Checking available funds...",
          success: "Funds allowance granted successfully.",
          error: getErrorWithInfoToast("Failed to allocate funds:"),
        });
      }

      taskId = taskToEdit.task_id;
      const editedCall = editTask({
        authAtlasSpace: authAtlasSpaceActor,
        args: {
          task_id: taskId,
          task_title: taskTitle !== taskToEdit.task_title ? [taskTitle] : [],
          token_reward: rewardPerUsageBn !== taskToEdit.token_reward.CkUsdc.amount ? [{ CkUsdc: { amount: rewardPerUsageBn } }]: [],
          start_time: startTimeUnixSec !== Number(taskToEdit.start_time) ? [BigInt(startTimeUnixSec)] : [],
          end_time: endTimeUnixSec !== Number(taskToEdit.end_time) ? [BigInt(endTimeUnixSec)] : [],
          number_of_uses: numberOfUsesBn !== taskToEdit.number_of_uses ? [numberOfUsesBn] : [],
          task_content: [
            taskContent.map(task => task
              ? [{ TitleAndDescription: {
                  task_title: task.title,
                  task_description: task.description,
                  allow_resubmit: task.allow_resubmit,
                  answer_format: task.answer_format,
                }}]
              : []
            )
          ],
        }
      });
      await toast.promise(editedCall, {
        loading: "Saving changes...",
        success: "Task updated successfully.",
        error: getErrorWithInfoToast("Failed to update task:"),
      });
    } else {
      const estimatedCost = calculateDepositAmount(rewardPerUsageBn, ckUsdcFee, numberOfUsesBn);
      const getOrSetAllowance = setUserSpaceAllowanceIfNeeded({
        unAuthCkUsd: unAuthCkUsdcActor,
        authCkUsdc: authCkUsdcActor,
        spacePrincipal: principal,
        amount: estimatedCost,
        userPrincipal: user.principal,
      });
      await toast.promise(getOrSetAllowance, {
        loading: "Checking available funds...",
        success: "Funds allowance granted successfully.",
        error: getErrorWithInfoToast("Failed to allocate funds:"),
      });

      const createNewTaskCall = createNewTask({
        authAtlasSpaceActor,
        numberOfUses: numberOfUsesBn,
        rewardPerUsage: rewardPerUsageBn,
        tasks: taskContent.filter((task) => task !== null),
        taskTitle,
        startTime: BigInt(startTimeUnixSec),
        endTime: BigInt(endTimeUnixSec),
      });
      taskId = await toast.promise(createNewTaskCall, {
        loading: "Creating new task...",
        success: "Task created successfully.",
        error: getErrorWithInfoToast("Failed to create task:"),
      });
    }
    callback();
    await getSpaceTasks({
      spaceId,
      unAuthAtlasSpace: authAtlasSpaceActor,
      dispatch,
    });
    await getUserBalance({
      unAuthCkUsdc: unAuthCkUsdcActor,
      userPrincipal: user?.principal,
      dispatch,
    });
    if (taskToEdit) {
      navigate(location.pathname);
    } else {
      navigate(`${location.pathname}/${taskId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className={`fixed inset-0 flex items-center justify-center h-full  ${
          isLoading ? "z-30 blur-sm" : "z-50"
        }`}
        onClick={callback}
      >
        <div
          className="flex flex-col rounded-xl bg-white p-[20px] gap-[10px] sm:w-[40rem] max-h-[80vh] overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h2 className="flex items-center justify-between font-semibold mb-4">
              {taskToEdit ? "Edit task" : "Create new task"}
            <Button
              onClick={() =>
                append({
                  taskType: "generic",
                  title: "",
                  description: "",
                  allowResubmit: false,
                  answerFormat: "Small", 
                })
              }
              className="flex gap-2"
            >
              <FiPlus /> Add subtask
            </Button>
          </h2>
          <div className="border-l-2 pl-2 border-[#9173FF] border-dashed lex items-center justify-between font-semibold gap-2">
            <p className="text-gray-600">Main task title:</p>
            <input
              type="text"
              min="1"
              max="256"
              {...register("taskTitle")}
              className={`border-2 p-2 rounded-xl w-full ${
                errors?.taskTitle?.message && "border-red-500"
              }`}
            />
            {errors?.taskTitle?.message && (
              <span className="text-red-500">
                {errors?.taskTitle?.message.toString()}
              </span>
            )}
            <NumericInputForm
              register={register}
              name={"numberOfUses"}
              label="Number of task uses:"
              errors={errors}
            />
            <DecimalInputForm
              register={register}
              label="XP Reward per usage:"
              small="1XP == 1ckUSDC"
              maxDecimalPlaces={DECIMALS}
              name="rewardPerUsage"
              errors={errors}
              className={`mb-2 ${hasAnySubmissions ? "pointer-events-none opacity-50" : ""}`}
            />

            <label className="text-gray-600">Start time:</label>
            <input
              type="datetime-local"
              {...register("startTime")}
              className={`border-2 p-2 rounded-xl w-full ${
                errors?.startTime?.message ? "border-red-500" : ""
              }`}
            />
            {errors?.startTime && (
              <span className="text-red-500 flex">{errors.startTime.message}</span>
            )}

            <label className="text-gray-600">End time:</label>
            <input
              type="datetime-local"
              {...register("endTime")}
              className={`border-2 p-2 rounded-xl w-full ${
                errors?.endTime?.message ? "border-red-500" : ""
              }`}
            />
            {errors?.endTime && (
              <span className="text-red-500 flex">{errors.endTime.message}</span>
            )}

            {fields.map((field, index) => {
              const currentTask = watch(`tasks.${index}`);
              if ("disabled" in currentTask) {
                return (
                  <div key={field.id} className="border p-4 rounded-xl mb-4 bg-gray-100 text-gray-400">
                    Subtask #{index + 1} (deleted)
                  </div>
                );
              }

              return (
                <div
                  key={field.id}
                  className="border p-4 rounded-xl mb-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-lg font-semibold">
                      Subtask #{index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const currentTasks = [...(watch("tasks") ?? [])];
                        currentTasks[index] = { disabled: true };
                        setValue("tasks", currentTasks);
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="border-l-2 pl-2 border-[#9173FF] border-dashed">
                    <p className="text-gray-600">Task type:</p>
                    <select
                      {...register(`tasks.${index}.taskType`)}
                      className="border-2 p-2 rounded-xl w-full"
                    >
                      <option value="generic">Generic text task</option>
                    </select>
                    <div className="mt-4">
                      <label className="text-gray-600 font-semibold">Answer format:</label>
                      <select
                        {...register(`tasks.${index}.answerFormat`)}
                        className="border-2 p-2 rounded-xl w-full mt-1"
                      >
                        {answerFormats.map((format) => {
                          const key = getAnswerFormatKey(format);
                          return (
                            <option key={key} value={key}>
                              {key} – {answerFormatDescriptions[key]}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {currentTask.taskType === "generic" && (
                      <GenericTask
                        register={register}
                        index={index}
                        errors={errors}
                        maxTitleLength={maxSubtitleLength}
                        maxDescriptionLength={maxDescriptionLength}
                      />
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        id={`allowResubmit-${index}`}
                        {...register(`tasks.${index}.allowResubmit`)}
                        className="form-checkbox h-5 w-5 text-[#9173FF] rounded"
                      />

                      <label
                        htmlFor={`allowResubmit-${index}`}
                        className="text-gray-600 font-semibold"
                      >
                        Allow re-submission for this subtask if rejected
                      </label>
                      {!("disabled" in currentTask) && errors?.tasks?.[index] && (
                        <span className="text-red-500">
                          {(errors.tasks[index] as GenericTaskError).allowResubmit?.message.toString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            <div className="justify-between font-semibold flex items-center justify-center gap-2">
              Estimated cost: {formatUnits(estimatedCost, DECIMALS)}
              <img src="/icons/ckUSDC.svg" className="w-6" />
            </div>
            <Button>
              {taskToEdit ? "Save changes" : "Create task!"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateNewTaskModal;

