import React, { useRef, useEffect, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  type FieldErrorsImpl,
} from "react-hook-form";
import Button from "../components/Shared/Button";
import SpaceHeader from "../components/Shared/SpaceHeader";
import * as yup from "yup";
import { formatUnits, parseUnits } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { DECIMALS } from "../canisters/ckUsdcLedger/constans";
import {
  createNewTask,
  editTask,
  getSpaceTasks,
} from "../canisters/atlasSpace/api";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useAuthAtlasSpaceActor,
  useAuthCkUsdcLedgerActor,
  useUnAuthCkUsdcLedgerActor,
  getUnAuthAtlasSpaceActor,
  useUnAuthAgent,
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
import { getSpacePath, getTaskPath } from "../router/paths";
import type { Space } from "../store/slices/spacesSlice";
import { getAtlasSpace } from "../canisters/atlasSpace/api";
import { RiCloseLargeLine } from "react-icons/ri";
import { FaPlus } from "react-icons/fa6";
import { FaCalendar } from "react-icons/fa";
import NumericInputForm from "../components/Shared/NumericInputForm";
import DecimalInputForm from "../components/Shared/DecimalInputForm";
import { runWithLoading } from "../utils/loading";
import {
  toLocalISOString,
  formatDateShortMonth,
  formatDateShortHour,
} from "../utils/date";
import type { Task } from "../../../declarations/atlas_space/atlas_space.did";
import { mapTaskToForm } from "../utils/taskFormMapper";
import type { AnswerFormat } from "../../../declarations/atlas_space/atlas_space.did";
import { sortKeys } from "../utils/sort";
import DateTimeDisplayPicker from "../components/Shared/DateTimeDisplayPicker";
import {
  BlockchainUser,
  selectUserBlockchainData,
  type StorableUser,
} from "../store/slices/userSlice";
import DiscordTask from "./tasks/DiscordTask";
import TwitterTask from "./tasks/TwitterTask";
import { mapTasks, TaskType, type TaskInput } from "../utils/taskMapper";

export const getAnswerFormatKey = (format: AnswerFormat): string =>
  Object.keys(format)[0];
const answerFormatDescriptions: Record<string, string> = {
  Small: "Up to 254 characters",
  Paragraph: "Up to 600 characters",
  Long: "Up to 2500 characters",
  List: "Multiple items, each up to 254 characters",
};

interface CreateNewTaskFormInput {
  numberOfUses: number;
  rewardPerUsage: number;
  taskTitle: string;
  startTime: string;
  endTime: string;
  tasks: (TaskInput | { disabled: boolean })[];
}

type GenericTaskError = {
  allowResubmit?: { message: string };
};
type TaskForm = CreateNewTaskFormInput["tasks"][number];
type GenericTaskForm = Extract<TaskForm, { taskType: TaskType }>;

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

const genericTaskSchema = yup.object({
  taskType: yup.mixed<TaskType>().oneOf([TaskType.Generic]).required(),
  title: yup.string().trim().max(maxSubtitleLength).required(),
  description: yup.string().trim().max(maxDescriptionLength).required(),
  allowResubmit: yup.boolean().required(),
  answerFormat: yup.string().oneOf(answerFormatKeys).required(),
});

const twitterTaskSchema = yup.object({
  taskType: yup.mixed<TaskType>().oneOf([TaskType.Twitter]).required(),
  title: yup.string().trim().max(maxSubtitleLength).required(),
  description: yup.string().trim().max(maxDescriptionLength).required(),
  allowResubmit: yup.boolean().required(),
});

const discordTaskSchema = yup.object({
  taskType: yup.mixed<TaskType>().oneOf([TaskType.Discord]).required(),
  title: yup.string().trim().max(maxSubtitleLength).required(),
  description: yup.string().trim().max(maxDescriptionLength).required(),
  guildId: yup.string().required("Guild ID is required for Discord tasks"),
  inviteLink: yup
    .string()
    .matches(
      /^(https?:\/\/)?(www\.)?discord\.(gg|com\/invite)\/[a-zA-Z0-9-]+$/,
      "Invalid Discord invite link"
    )
    .required("Invite link is required for Discord tasks"),
  allowResubmit: yup.boolean().required(),
});

const taskOrDisabledSchema = yup.lazy((value) => {
  if (value && "disabled" in value) {
    return yup.object({ disabled: yup.boolean().required() });
  }

  switch (value?.taskType) {
    case TaskType.Twitter:
      return twitterTaskSchema;
    case TaskType.Discord:
      return discordTaskSchema;
    case TaskType.Generic:
      return genericTaskSchema;
    default:
      return genericTaskSchema;
  }
});

export interface EditableTask extends Task {
  task_id: bigint;
}

const CreateNewTaskModal = () => {
  const { spacePrincipal, taskId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = pathname.endsWith("/edit")
    ? "Edit mission"
    : "Create new mission";
  const [isInviteValid, setInviteValid] = useState(false);

  const principal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  const { user } = useAuth();
  if (!principal) return <></>;
  const agent = useUnAuthAgent();
  const spaceId = principal.toString();

  const space = useSelector((state: RootState) => {
    const serializedSpace =
      state.spaces?.spaces?.[principal.toString()] ?? null;
    return deserialize<Space>(serializedSpace);
  });

  const taskToEdit: EditableTask | null =
    taskId && space?.tasks?.[taskId] && "timer_id" in space.tasks[taskId]
      ? {
          ...space.tasks[taskId],
          task_id: BigInt(taskId),
        }
      : null;

  const renderedAt = new Date();
  const schema = yup.object({
    taskTitle: yup
      .string()
      .trim()
      .max(maxTitleLength)
      .required("Task title is required")
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
          return new Date(value).getTime() >= Date.now();
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
    tasks: yup.array().of(taskOrDisabledSchema).min(1).required(),
  });

  const dispatch = useDispatch();
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
          startTime: toLocalISOString(renderedAt).slice(0, 16),
          endTime: "",
          tasks: [
            {
              taskType: TaskType.Generic,
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

  const userBlockchainData = deserialize<StorableUser>(
    useSelector(selectUserBlockchainData)
  );
  const userInfo = userBlockchainData
    ? new BlockchainUser(userBlockchainData)
    : null;

  const avatarImg = space?.state?.space_logo;
  const spaceName = space?.state?.space_name;
  const spaceDescription = space?.state?.space_description;
  const spaceBackground = space?.state?.space_background;
  const spaceData = space?.state;

  useEffect(() => {
    if (!agent || spaceData) return;

    const loadSpaceData = async () => {
      const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, principal);
      await getAtlasSpace({
        spaceId,
        unAuthAtlasSpace,
        dispatch,
      });
    };

    runWithLoading(loadSpaceData, dispatch);
  }, [dispatch, agent, spaceData, principal, spaceId]);

  const authAtlasSpaceActor = useAuthAtlasSpaceActor(principal);
  const unAuthCkUsdcActor = useUnAuthCkUsdcLedgerActor();
  const authCkUsdcActor = useAuthCkUsdcLedgerActor();
  const parsedSpacePrincipal = useSpaceId({
    spacePrincipal,
    navigate,
  });
  if (!parsedSpacePrincipal) return <></>;

  const blockchainConfig = deserialize<StorableConfig>(
    useSelector(selectBlockchainConfig)
  );

  const calculateDepositAmount = (
    amount: bigint,
    fee: bigint,
    numberOfUses: bigint
  ) => {
    return amount * numberOfUses + fee * numberOfUses + fee;
  };

  const ckUsdcFee = blockchainConfig
    ? blockchainConfig.ckusdc_ledger.fee ?? 0n
    : 0n;

  const numberOfUses = watch("numberOfUses");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rewardPerUsage = watch("rewardPerUsage") as any;

  const numberOfUsesNormalized = isNaN(numberOfUses) ? 0 : numberOfUses;
  const rewardPerUsageNormalized =
    isNaN(rewardPerUsage) || rewardPerUsage === "" ? 0 : rewardPerUsage;

  const rewardPerUsageBn = parseUnits(
    rewardPerUsageNormalized.toString(),
    DECIMALS
  );
  const numberOfUsesBn = BigInt(numberOfUsesNormalized);
  const estimatedCost = calculateDepositAmount(
    rewardPerUsageBn,
    ckUsdcFee,
    numberOfUsesBn
  );

  const hasAnySubmissions =
    !!taskToEdit &&
    taskToEdit.tasks.some((t) => {
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

    const taskContent = mapTasks(
      (tasks ?? []).filter((t): t is TaskInput => "taskType" in t)
    );

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
          .map((t) => {
            if ("GenericTask" in t) {
              const content = t.GenericTask.task_content;
              if ("TitleAndDescription" in content) {
                return {
                  task_content: content.TitleAndDescription,
                };
              }
              console.warn("Unexpected task_content format:", content);
              return null;
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
        tasks: taskContent
          .map((task) => {
            if (!task) return null;

            switch (task.task_type) {
              case "generic":
                return {
                  task_content: {
                    task_type: "generic",
                    title: task.title,
                    description: task.description,
                    allow_resubmit: task.allow_resubmit,
                    answer_format: task.answer_format,
                  },
                };

              case "discord":
                return {
                  task_content: {
                    task_type: "discord",
                    title: task.title,
                    description: task.description,
                    invite_link: task.invite_link,
                    guild_id: task.guild_id,
                    allow_resubmit: task.allow_resubmit,
                  },
                };

              case "twitter":
                return {
                  task_content: {
                    task_type: "twitter",
                    title: task.title,
                    description: task.description,
                    allow_resubmit: task.allow_resubmit,
                  },
                };

              default:
                console.warn("Unknown task type:", task);
                return null;
            }
          })
          .filter(Boolean),
      };

      taskId = taskToEdit.task_id;

      const isSameTask =
        JSON.stringify(sortKeys(oldTaskData)) ===
        JSON.stringify(sortKeys(newTaskData));
      if (isSameTask) {
        toast.success("No changes detected, task not updated.");
        navigate(getTaskPath(principal, taskId.toString()));
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

      await runWithLoading(async () => {
        if (newDepositAndFee > currentDepositAndFee) {
          const extraCost =
            newDepositAndFee - currentDepositAndFee + BigInt(ckUsdcFee);
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

        const editedCall = editTask({
          authAtlasSpace: authAtlasSpaceActor,
          args: {
            task_id: taskId,
            task_title: taskTitle !== taskToEdit.task_title ? [taskTitle] : [],
            token_reward:
              rewardPerUsageBn !== taskToEdit.token_reward.CkUsdc.amount
                ? [{ CkUsdc: { amount: rewardPerUsageBn } }]
                : [],
            start_time:
              startTimeUnixSec !== Number(taskToEdit.start_time)
                ? [BigInt(startTimeUnixSec)]
                : [],
            end_time:
              endTimeUnixSec !== Number(taskToEdit.end_time)
                ? [BigInt(endTimeUnixSec)]
                : [],
            number_of_uses:
              numberOfUsesBn !== taskToEdit.number_of_uses
                ? [numberOfUsesBn]
                : [],
            task_content: [
              taskContent.map((task) => {
                if (!task) return [];

                switch (task.task_type) {
                  case "generic":
                    return [
                      {
                        TitleAndDescription: {
                          task_title: task.title,
                          task_description: task.description,
                          allow_resubmit: task.allow_resubmit,
                          answer_format: task.answer_format,
                        },
                      },
                    ];

                  case "discord":
                    return [
                      {
                        DiscordTask: {
                          task_title: task.title,
                          task_description: task.description,
                          invite_link: task.invite_link,
                          guild_id: task.guild_id,
                          allow_resubmit: task.allow_resubmit,
                        },
                      },
                    ];

                  case "twitter":
                    return [
                      {
                        TwitterTask: {
                          task_title: task.title,
                          task_description: task.description,
                          x_post_link: task.x_post_link,
                          allow_resubmit: task.allow_resubmit,
                          x_answer_format: task.x_answer_format
                        },
                      },
                    ];

                  default:
                    console.warn("Unknown task type:", task);
                    return [];
                }
              }),
            ],
          },
        });
        await toast.promise(editedCall, {
          loading: "Saving changes...",
          success: "Task updated successfully.",
          error: getErrorWithInfoToast("Failed to update task:"),
        });

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
        navigate(getTaskPath(principal, taskId.toString()));
      }, dispatch);
    } else {
      await runWithLoading(async () => {
        const estimatedCost = calculateDepositAmount(
          rewardPerUsageBn,
          ckUsdcFee,
          numberOfUsesBn
        );
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
        const taskId = await toast.promise(createNewTaskCall, {
          loading: "Creating new task...",
          success: "Task created successfully.",
          error: getErrorWithInfoToast("Failed to create task:"),
        });

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
        navigate(getTaskPath(principal, taskId.toString()));
      }, dispatch);
    }
  };

  const formatDisplayDateTime = (dateTimeString: string | null | undefined) => {
    if (!dateTimeString) return { date: "N/A", time: "N/A" };
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return { date: "N/A", time: "N/A" };

    return {
      date: formatDateShortMonth(date),
      time: formatDateShortHour(date),
    };
  };

  const currentStartTime = watch("startTime");
  const currentEndTime = watch("endTime");

  const formattedStartTime = formatDisplayDateTime(currentStartTime);
  const formattedEndTime = formatDisplayDateTime(currentEndTime);

  const startTimeInputRef = useRef<HTMLInputElement | null>(null);
  const endTimeInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartTimeClick = () => {
    startTimeInputRef.current?.showPicker();
  };

  const handleEndTimeClick = () => {
    endTimeInputRef.current?.showPicker();
  };

  const { ref: startTimeRegisterRef, ...startTimeRest } = register("startTime");

  const { ref: endTimeRegisterRef, ...endTimeRest } = register("endTime");

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleTaskTypeChange = (index: number, type: TaskType) => {
    const tasks = [...(watch("tasks") ?? [])];
    tasks[index] = { ...tasks[index], taskType: type };
    setValue("tasks", tasks);
  };

  return (
    <div className="bg-gradient-to-b from-background to-primary overflow-auto  flex flex-1 w-full items-center justify-center pb-12">
      <div className="flex-col flex-1">
        <SpaceHeader
          spaceName={spaceName}
          spaceDescription={spaceDescription}
          spaceLogo={avatarImg}
          spaceBackground={spaceBackground}
          externalLinks={spaceData?.external_links || null}
          userInfo={userInfo}
          spacePrincipal={principal}
        />
        <div className="w-full rounded-3xl px-4 sm:px-8 lg:px-12 relative flex flex-col">
          <div className="w-full h-[1px] bg-white/40 mb-3" />
          <div className="flex flex-1 justify-between">
            <Button
              variant="dark"
              className="gap-2 px-4"
              onClick={() => navigate(getSpacePath(parsedSpacePrincipal))}
            >
              All Missions
            </Button>
            <Button
              variant="publish"
              onClick={() => navigate(-1)}
              className="px-2 font-semibold rounded text-sm sm:text-base"
            >
              <RiCloseLargeLine className="mr-2" /> Close
            </Button>
          </div>
          <div className="w-full h-[1px] bg-white/40 mb-3 my-3" />

          <form onSubmit={handleSubmit(onSubmit, (errors) => {
            console.log("Yup validation errors:", errors);
            toast.error("Form validation failed — check console");
          })}
          >
            <h2 className="text-white font-medium font-montserrat text-xl sm:text-2xl mb-4">
              {title}
            </h2>
            <div className="flex flex-col lg:flex-row gap-6 mb-4 flex-grow">
              <div className="flex-1">
                <div className="bg-dark/20 p-2 rounded mb-6">
                  <div className="flex flex-col md:flex-row gap-2.5 px-2.5 py-1 justify-between items-start md:items-center text-white text-sm">
                    <DateTimeDisplayPicker
                      label="Starts:"
                      icon={<FaCalendar className="w-5 h-4 sm:w-6 sm:h-5" />}
                      formatted={formattedStartTime}
                      onClick={handleStartTimeClick}
                      inputProps={startTimeRest}
                      ref={(el) => {
                        startTimeRegisterRef(el);
                        startTimeInputRef.current = el;
                      }}
                      errorMessage={errors?.startTime?.message?.toString()}
                      className="w-full"
                    />
                    <DateTimeDisplayPicker
                      label="Ends:"
                      formatted={formattedEndTime}
                      onClick={handleEndTimeClick}
                      inputProps={endTimeRest}
                      ref={(el) => {
                        endTimeRegisterRef(el);
                        endTimeInputRef.current = el;
                      }}
                      errorMessage={errors?.endTime?.message?.toString()}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[max-content_1fr] md:gap-x-4">
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex flex-col md:flex-row md:items-center mb-2">
                      <p className="text-white font-semibold font-montserrat w-full md:w-36 pl-0 md:pl-4 mb-1 md:mb-0">
                        Mission Title:
                      </p>
                      <input
                        type="text"
                        min="1"
                        max="256"
                        className="flex-1 rounded p-2 bg-dark/20 text-white w-full border-0 outline-none focus:outline-none"
                        {...register("taskTitle")}
                      />
                    </div>
                    {errors.taskTitle && (
                      <p className="text-sm text-red-300 font-montserrat font-medium mb-2 ml-0 md:ml-[143px]">
                        {errors.taskTitle.message?.toString()}
                      </p>
                    )}
                  </div>
                  <label className="text-white font-semibold font-montserrat w-32 md:pl-4 self-start mt-2 md:mt-6">
                    Rewards:
                  </label>
                  <div className="flex flex-col w-full gap-4 bg-dark/20 p-4 sm:p-6 rounded-2xl mb-6 mt-4 md:mt-0">
                    <div className="flex-1">
                      <NumericInputForm
                        register={register}
                        name={"numberOfUses"}
                        label="Number of task uses:"
                        errors={errors}
                      />
                    </div>
                    <div className="flex-1">
                      <DecimalInputForm
                        register={register}
                        label="ckUSDC Reward per usage:"
                        small="1ckUSDC == 1XP"
                        maxDecimalPlaces={DECIMALS}
                        name="rewardPerUsage"
                        errors={errors}
                        className={`mb-2 ${
                          hasAnySubmissions
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      />
                      <div className="font-semibold font-montserrat flex text-white items-center justify-end gap-2">
                        Estimated cost: {formatUnits(estimatedCost, DECIMALS)}
                        <img src="/icons/ckUSDC.svg" className="w-6" />
                      </div>
                    </div>
                  </div>
                </div>
                {fields.length > 0 && (
                  <>
                    {fields.map((field, index) => {
                      const currentTask = watch(`tasks.${index}`);
                      if ("disabled" in currentTask) {
                        return (
                          <div
                            key={field.id}
                            className="bg-dark/20 rounded-lg p-4 sm:p-6 mb-6 shadow-lg"
                          >
                            <h3 className="bg-dark text-white text-base sm:text-lg font-montserrat font-medium py-1 px-3 sm:px-4 rounded-md inline-block">
                              Task {index + 1} (deleted)
                            </h3>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={field.id}
                          className="bg-dark/20 rounded-lg p-4 sm:p-6 mb-6 shadow-lg"
                        >
                          <h3 className="bg-dark text-white text-base sm:text-lg font-montserrat font-medium py-1 px-3 sm:px-4 rounded-md inline-block mb-4">
                            Task {index + 1}
                          </h3>
                          {currentTask.taskType === TaskType.Generic && (
                            <>
                              <div className="mb-4">
                                <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
                                  Task Title
                                </label>
                                <input
                                  type="text"
                                  {...register(`tasks.${index}.title`)}
                                  className="w-full p-3 rounded-lg bg-primary/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                                  placeholder="Enter task title"
                                />
                                {(
                                  errors?.tasks?.[
                                    index
                                  ] as FieldErrorsImpl<GenericTaskForm>
                                )?.title && (
                                  <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
                                    {(
                                      errors.tasks?.[
                                        index
                                      ] as FieldErrorsImpl<GenericTaskForm>
                                    )?.title?.message?.toString()}
                                  </p>
                                )}
                              </div>
                              <div className="mb-4">
                                <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
                                  Description
                                </label>
                                <textarea
                                  {...register(`tasks.${index}.description`)}
                                  className="w-full p-3 rounded-lg bg-primary/20 text-white h-24 resize-none md:overflow-hidden placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                                  placeholder="Mission description here."
                                  onInput={(e) => resize(e.currentTarget)}
                                  rows={3}
                                />
                                {(
                                  errors?.tasks?.[
                                    index
                                  ] as FieldErrorsImpl<GenericTaskForm>
                                )?.description && (
                                  <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
                                    {(
                                      errors.tasks?.[
                                        index
                                      ] as FieldErrorsImpl<GenericTaskForm>
                                    )?.description?.message?.toString()}
                                  </p>
                                )}
                              </div>
                              <div className="mb-6">
                                <div className="flex items-center justify-start flex-wrap gap-3 mb-2">
                                  <label className="text-white text-base sm:text-lg font-montserrat font-semibold flex-shrink-0 mr-2">
                                    Answer format:
                                  </label>
                                  <select
                                    {...register(`tasks.${index}.answerFormat`)}
                                    className="w-full p-3 pr-10 rounded-lg bg-primary text-white font-montserrat cursor-pointer appearance-none focus:outline-none"
                                  >
                                    {answerFormats.map((format) => {
                                      const key = getAnswerFormatKey(format);
                                      return (
                                        <option
                                          key={key}
                                          value={key}
                                          className="bg-primary text-white"
                                        >
                                          {key} –{" "}
                                          {answerFormatDescriptions[key]}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>
                            </>
                          )}
                          {currentTask.taskType === TaskType.Discord && (
                            <DiscordTask
                              register={register}
                              index={index}
                              errors={errors}
                              maxTitleLength={maxSubtitleLength}
                              maxDescriptionLength={maxDescriptionLength}
                              spacePrincipal={principal}
                              setInviteValid={setInviteValid}
                            />
                          )}
                          {currentTask.taskType === TaskType.Twitter && (
                            <TwitterTask
                              register={register}
                              index={index}
                              errors={errors}
                              maxTitleLength={maxSubtitleLength}
                              maxDescriptionLength={maxDescriptionLength}
                            />
                          )}

                          <div className="mb-6">
                            <div className="flex items-center justify-start flex-wrap gap-3 mb-2">
                              <label className="text-white text-base sm:text-lg font-montserrat font-semibold flex-shrink-0 mr-2">
                                Add-ons
                              </label>

                              <Button
                                variant="primary"
                                className="text-white px-3 sm:px-4 rounded font-medium text-sm sm:text-base"
                                onClick={() =>
                                  handleTaskTypeChange(index, TaskType.Generic)
                                }
                              >
                                Generic Task
                              </Button>
                              <Button
                                variant="primary"
                                className="text-white px-3 sm:px-4 rounded font-medium text-sm sm:text-base"
                                onClick={() =>
                                  handleTaskTypeChange(index, TaskType.Discord)
                                }
                              >
                                Discord Task
                              </Button>
                              <Button
                                variant="primary"
                                className="text-white px-3 sm:px-4 rounded font-medium text-sm sm:text-base"
                                onClick={() =>
                                  handleTaskTypeChange(index, TaskType.Twitter)
                                }
                              >
                                Twitter Task
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-6 justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`allowResubmit-${index}`}
                                {...register(`tasks.${index}.allowResubmit`)}
                                className="form-checkbox h-5 w-5 text-primary rounded"
                              />
                              <label
                                htmlFor={`allowResubmit-${index}`}
                                className="text-white font-montserrat text-sm sm:text-lg"
                              >
                                Allow re-submission for this subtask if rejected
                              </label>
                            </div>
                            <Button
                              variant="dark"
                              onClick={() => {
                                const currentTasks = [
                                  ...(watch("tasks") ?? []),
                                ];
                                currentTasks[index] = { disabled: true };
                                setValue("tasks", currentTasks);
                              }}
                              className="text-red-300 font-medium text-sm sm:text-base px-2 rounded-md mt-2 sm:mt-0"
                            >
                              Remove
                            </Button>
                          </div>
                          {!("disabled" in currentTask) &&
                            errors?.tasks?.[index] && (
                              <span className="text-red-500 text-sm mt-1 block">
                                {(
                                  errors.tasks[index] as GenericTaskError
                                ).allowResubmit?.message.toString()}
                              </span>
                            )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-6">
              <Button
                className="text-white bg-white/20 px-3 rounded font-semibold text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0"
                onClick={() =>
                  append({
                    taskType: TaskType.Generic,
                    title: "",
                    description: "",
                    allowResubmit: false,
                    answerFormat: "Small",
                  })
                }
              >
                Task <FaPlus className="ml-2" />
              </Button>
              {/* TODO: We should be saving form to localstorage than ("Save Draft" -> "Open Draft") to be able to restore information
              should be similar to EditSpace feat */
                    /* <Button
                variant="saveDraft"
                className="px-3 font-semibold text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0"
                onClick={() => toast("Draft saving not yet implemented")}
              >
                Save draft
              </Button> */}
              <Button
                variant="publish"
                disabled={
                  watch("tasks")?.some(
                    (task) =>
                      "taskType" in task && task.taskType === TaskType.Discord
                  ) && !isInviteValid
                }
                className="px-3 font-semibold text-sm sm:text-base w-full sm:w-auto"
              >
                Publish
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateNewTaskModal;
