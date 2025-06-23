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
import { createNewTask, getSpaceTasks } from "../canisters/atlasSpace/api";
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
import { selectBlockchainConfig } from "../store/slices/appSlice";

type TaskType = "generic";
const allowedTaskTypes = ["generic"] as const;

interface CreateNewTaskFormInput {
  numberOfUses: number;
  rewardPerUsage: number;
  taskTitle: string;
  tasks?: {
    taskType: TaskType;
    title: string;
    description: string;
  }[];
}
const maxSubtitleLength = 50;
const maxTitleLength = 50;
const maxDescriptionLength = 500;

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
});

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
  tasks: yup.array().of(taskSchema).min(1),
});

interface CreateNewTaskModalArgs {
  callback: () => void;
}

const CreateNewTaskModal = ({ callback }: CreateNewTaskModalArgs) => {
  const { spacePrincipal } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      numberOfUses: 1,
      rewardPerUsage: 0.1,
      tasks: [{ taskType: "generic", title: "", description: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
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

  const blockchainConfig = useSelector(selectBlockchainConfig);
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
  const estimatedCost =
    numberOfUsesBn * rewardPerUsageBn + numberOfUsesBn * ckUsdcFee + ckUsdcFee;

  const onSubmit: SubmitHandler<CreateNewTaskFormInput> = async ({
    numberOfUses,
    rewardPerUsage,
    tasks,
    taskTitle,
  }) => {
    const numberOfUsesBn = BigInt(numberOfUses.toString());
    const rewardPerUsageBn = parseUnits(rewardPerUsage.toString(), DECIMALS);

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

    const taskContent = tasks
      ?.map((task) => {
        if (task.taskType === "generic") {
          return {
            TitleAndDescription: {
              task_description: task.description,
              task_title: task.title,
            },
          };
        }
      })
      .filter((item) => item !== undefined);

    if (!taskContent || taskContent.length === 0) {
      toast.error("Invalid subtasks: the minimum number of subtasks is one.");
      return;
    }

    const estimatedCost =
      numberOfUsesBn * rewardPerUsageBn +
      numberOfUsesBn * ckUsdcFee +
      ckUsdcFee;
    const getOrSetAllowance = setUserSpaceAllowanceIfNeeded({
      unAuthCkUsd: unAuthCkUsdcActor,
      authCkUsdc: authCkUsdcActor,
      spacePrincipal: principal,
      amount: estimatedCost,
      userPrincipal: user.principal,
    });
    await toast.promise(getOrSetAllowance, {
      loading: "Checking available funds...",
      success: "Funds allowance granted successfully",
      error: "Insufficient funds",
    });

    const createNewTaskCall = createNewTask({
      authAtlasSpaceActor,
      numberOfUses: numberOfUsesBn,
      rewardPerUsage: rewardPerUsageBn,
      tasks: taskContent,
      taskTitle,
    });
    const taskId = await toast.promise(createNewTaskCall, {
      loading: "Creating new task...",
      success: "Task created successfully",
      error: "Failed to create task",
    });
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
    navigate(`${location.pathname}/${taskId}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center h-full"
        onClick={callback}
      >
        <div
          className="flex flex-col rounded-xl bg-white p-[20px] gap-[10px] w-[40rem] max-h-[80vh] overflow-y-auto"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h2 className="flex items-center justify-between font-semibold mb-4">
            Create new tasks
            <Button
              onClick={() =>
                append({
                  taskType: "generic",
                  title: "",
                  description: "",
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
              max="50"
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
              className="mb-2"
            />

            {fields.map((field, index) => {
              const taskType = watch(`tasks.${index}.taskType`);

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
                      onClick={() => remove(index)}
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

                    {taskType === "generic" && (
                      <GenericTask
                        register={register}
                        index={index}
                        errors={errors}
                        maxTitleLength={maxSubtitleLength}
                        maxDescriptionLength={maxDescriptionLength}
                      />
                    )}
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
            <Button>Create task!</Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateNewTaskModal;
