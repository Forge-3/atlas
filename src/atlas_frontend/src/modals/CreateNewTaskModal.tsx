import React from "react";
import { useEffect } from "react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Button from "../components/Shared/Button";
import { FiPlus } from "react-icons/fi";
import DecimalInputForm from "../components/Shared/DecimalInputForm";
import { formatUnits, parseUnits } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { customSerify, type RootState } from "../store/store";
import { DECIMALS } from "../canisters/ckUSDC/constans";
import { deserify } from "@karmaniverous/serify-deserify";
import GenericTask from "./tasks/GenericTask";
import NumericInputForm from "../components/Shared/NumericInputForm";
import { createNewTask, getSpaceTasks } from "../canisters/atlasSpace/api";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useAuthAtlasSpaceActor,
  useAuthCkUSDCActor,
  useUnAuthCkUSDCActor,
} from "../hooks/identityKit";
import { useSpaceId } from "../hooks/space";
import toast from "react-hot-toast";
import { setUserSpaceAllowanceIfNeeded } from "../canisters/ckUSDC/api";
import { useAuth } from "@nfid/identitykit/react";
import { clearDiscordIntegrationData, setDiscordIntegrationData } from "../store/slices/userSlice"; 
import DiscordTask from "./tasks/Discord";

type TaskType = "generic" | "discord";
const allowedTaskTypes = ["generic", "discord"] as const;

export interface CreateNewTaskFormInput {
  numberOfUses: number;
  rewardPerUsage: number;
  taskTitle: string;
  tasks: {
    taskType: TaskType;
    title: string;
    description: string;
    guildId?: string; 
    discordInviteLink?: string; 
    guildIcon?: string | null;
    expiresAt?: string | null;
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
  guildId: yup.string().when("taskType", {
    is: "discord",
    then: (schema) =>
      schema
        .trim()
        .min(1, "Guild ID must not be empty after successful link validation")
        .required("Guild ID is required for Discord tasks after link validation"),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  guildIcon: yup.string().nullable().notRequired(),
  discordInviteLink: yup.string().when('taskType', {
    is: 'discord',
    then: (schema) => schema
    .url("Must be a valid URL")
    .required("Discord invite link is required for Discord tasks.")
    .matches(/^https:\/\/(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]{6,10}$/, "Invalid Discord invite link format. Must be https://discord.gg/XXXXXX or https://discord.com/invite/XXXXXX (6-10 alphanumeric chars or a custom vanity URL).")
    .min(1, "Discord invite link cannot be empty."),
    otherwise: (schema) => schema.notRequired(),
  }),
  expiresAt: yup.string().nullable().notRequired(),
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
  tasks: yup.array().of(taskSchema).min(1).required(),
});

interface CreateNewTaskModalArgs {
  callback: () => void;
}

const CreateNewTaskModal = ({ callback }: CreateNewTaskModalArgs) => {
  const { spacePrincipal } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateNewTaskFormInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      taskTitle: "",
      numberOfUses: 1,
      rewardPerUsage: 0.1,
      tasks: [{ taskType: "generic", title: "", description: "", guildId: "", discordInviteLink: "", expiresAt: null }],
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
  
  if (!principal) return <></>;
  const spaceId = principal.toString();

  const authAtlasSpaceActor = useAuthAtlasSpaceActor(principal);
  const unAuthCkUSDCActor = useUnAuthCkUSDCActor();
  const authCkUSDCActor = useAuthCkUSDCActor();

  const selectedCkUsdcFee = useSelector(
    (state: RootState) => state.app.blockchainConfig?.ckusdc_ledger.fee
  );
  const ckUsdcFee = selectedCkUsdcFee
    ? (deserify(selectedCkUsdcFee, customSerify) as bigint)
    : 0n;

  const numberOfUses = watch("numberOfUses");
  const rewardPerUsage = watch("rewardPerUsage");

  const numberOfUsesNormalized = isNaN(numberOfUses) ? 0 : numberOfUses;
  const rewardPerUsageNormalized =
    isNaN(rewardPerUsage) ? 0 : rewardPerUsage;

  const rewardPerUsageBn = parseUnits(
    rewardPerUsageNormalized.toString(),
    DECIMALS
  );
  const numberOfUsesBn = BigInt(numberOfUsesNormalized);
  const estimatedCost =
    numberOfUsesBn * rewardPerUsageBn + numberOfUsesBn * ckUsdcFee + ckUsdcFee;

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const { accessToken, tokenType, state, expiresIn } = event.data as { accessToken?: string; tokenType?: string; state?: string; expiresIn?: string; };

      if (accessToken && state && user?.principal.toString() === state) {
        toast.loading("Connecting to Discord...", { id: "discordConnectToast" });
        try {
          dispatch(setDiscordIntegrationData({
            tokenType: tokenType || "",
            accessToken: accessToken,
            state: state,
            expiresIn: parseInt(expiresIn || "0", 10),

          }));
          toast.success("Successfully connected to Discord!", { id: "discordConnectToast" });

        } catch (e) {
          console.error("Error processing Discord OAuth callback:", e);
          toast.error("Failed to connect to Discord. Please try again.", { id: "discordConnectToast" });
          dispatch(clearDiscordIntegrationData());
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [user?.principal, dispatch]);


  const onSubmit: SubmitHandler<CreateNewTaskFormInput> = async ({
    numberOfUses,
    rewardPerUsage,
    tasks,
    taskTitle
  }) => {
    const numberOfUsesBn = BigInt(numberOfUses.toString());
    const rewardPerUsageBn = parseUnits(rewardPerUsage.toString(), DECIMALS);

    if (
      !authAtlasSpaceActor ||
      !unAuthCkUSDCActor ||
      !authCkUSDCActor ||
      !user
    ) {
      toast.error("Session expired");
      navigate("/");
      return;
    }

    const subtasks = tasks?.map((task) => {
        let guildIdForCandid: [] | [string];
        if (task.taskType === "discord" && typeof task.guildId === 'string' && task.guildId.length > 0) {
          guildIdForCandid = [task.guildId];
        } else {
          guildIdForCandid = [];
        }

        let discordInviteLinkForCandid: [] | [string];
        if (task.taskType === "discord" && typeof task.discordInviteLink === 'string' && task.discordInviteLink.length > 0) {
          discordInviteLinkForCandid = [task.discordInviteLink];
        } else {
          discordInviteLinkForCandid = [];
        }

        console.log("Form guildIcon for task:", task.guildIcon);
        let guildIconForCandid: [] | [string];
        if (task.taskType === "discord" && typeof task.guildIcon === 'string' && task.guildIcon.length > 0) {
          guildIconForCandid = [task.guildIcon];
        } else {
          guildIconForCandid = [];
        }
        console.log("guildIconForCandid (to be sent to Candid):", guildIconForCandid);

        let expiresAtForCandid: [] | [string];
        if (task.taskType === "discord" && typeof task.expiresAt === 'string' && task.expiresAt.length > 0) {
          expiresAtForCandid = [task.expiresAt];
        } else {
          expiresAtForCandid = [];
        }


        const baseSubtask = {
          kind: task.taskType,
          content: {
            TitleAndDescription: {
              task_title: task.title,
              task_description: task.description,
            },
          },
          guild_id: guildIdForCandid, 
          discord_invite_link: discordInviteLinkForCandid,
          guild_icon: guildIconForCandid, 
          expires_at: expiresAtForCandid,
        };

        if (task.taskType === "discord" && (!task.guildId || task.guildId.length === 0)) {
            toast.error("Discord link validation failed: Guild ID is missing. Please re-check the link.");
            throw new Error("Discord link validation failed: Guild ID is missing.");
        }
        if (task.taskType === "discord" && (!task.discordInviteLink || task.discordInviteLink.length === 0)) {
            toast.error("Discord link validation failed: Invite link is missing. Please re-check the link.");
            throw new Error("Discord link validation failed: Invite link is missing.");
        }

        return baseSubtask;
      }) ?? [];

    if (subtasks.length === 0) {
      toast.error("Invalid subtasks: the minimum number of subtasks is one.");
      return;
    }

  const estimatedCost =
    numberOfUsesBn * rewardPerUsageBn +
    numberOfUsesBn * ckUsdcFee +
    ckUsdcFee;
  const getOrSetAllowance = setUserSpaceAllowanceIfNeeded({
    unAuthCkUSD: unAuthCkUSDCActor,
    authCkUSDC: authCkUSDCActor,
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
    subtasks,
    taskTitle,
  });

  const taskId = await toast.promise(createNewTaskCall, {
    loading: "Creating new task...",
    success: "Task created successfully",
    error: "Failed to create task",
  });

  callback();
  getSpaceTasks({
    spaceId,
    unAuthAtlasSpace: authAtlasSpaceActor,
    dispatch,
  });
  const targetUrl = `${location.pathname}/${taskId}`;
  navigate(targetUrl); 
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className="absolute inset-0 z-50 flex items-center justify-center"
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
                  guildId: "", 
                  discordInviteLink: "",
                  expiresAt: null,
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
                      <option value="discord">Discord task</option>
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
                    {taskType === "discord" && (
                      <DiscordTask 
                        register={register}
                        index={index}
                        errors={errors}
                        maxTitleLength={maxSubtitleLength}
                        maxDescriptionLength={maxDescriptionLength}
                        spacePrincipal={principal}
                        setValue={setValue}
                        control={control}
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