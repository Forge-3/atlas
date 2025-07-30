import React, { useRef, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import Button from "../components/Shared/Button";
import * as yup from "yup";
import { formatUnits, parseUnits } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import { DECIMALS } from "../canisters/ckUsdcLedger/constans";
import { createNewTask, getSpaceTasks } from "../canisters/atlasSpace/api";
import { useNavigate, useParams } from "react-router-dom";
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
import { getTaskPath } from "../router/paths";
import type { Space } from "../store/slices/spacesSlice";
import { getAtlasSpace } from "../canisters/atlasSpace/api";
import { RiCloseLargeLine } from "react-icons/ri";
import { FaPlus } from "react-icons/fa6";
import { FaCalendar } from "react-icons/fa";
import NumericInputForm from "../components/Shared/NumericInputForm";
import DecimalInputForm from "../components/Shared/DecimalInputForm";
import { runWithLoading } from "../utils/loading";
import { toLocalISOString, formatDateShortMonth, formatDateShortHour } from "../utils/date";
import DateTimeDisplayPicker from "../components/Shared/DateTimeDisplayPicker";

type TaskType = "generic";
const allowedTaskTypes = ["generic"] as const;

interface CreateNewTaskFormInput {
  numberOfUses: number;
  rewardPerUsage: number;
  taskTitle: string;
  startTime: string;
  endTime: string;
  tasks?: {
    taskType: TaskType;
    title: string;
    description: string;
    allowresubmit: boolean;
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
  allowresubmit: yup.boolean().required(),
});

const CreateNewTaskModal = () => {
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
  tasks: yup.array().of(taskSchema).min(1),
  });

  const { spacePrincipal } = useParams();
  const navigate = useNavigate();
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
      tasks: [
        {
          taskType: "generic",
          title: "",
          description: "",
          allowresubmit: false,
        },
      ],
      startTime: toLocalISOString(renderedAt).slice(0, 16),
      endTime: '',
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
  const agent = useUnAuthAgent();
  
  if (!principal) return <></>;
  const spaceId = principal.toString();
 
  const space = useSelector((state: RootState) => {
    const serializedSpace = state.spaces?.spaces?.[principal.toString()] ?? null;
    return deserialize<Space>(serializedSpace);
  });

  const avatarImg = space?.state?.space_logo;
  const spaceName = space?.state?.space_name;
  const spaceDescription = space?.state?.space_description;
  const spaceBackground = space?.state?.space_background
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

  const blockchainConfig = deserialize<StorableConfig>(
    useSelector(selectBlockchainConfig)
  );
  const ckUsdcFee = blockchainConfig
    ? (blockchainConfig.ckusdc_ledger.fee ?? 0n)
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
  const estimatedCost =
    numberOfUsesBn * rewardPerUsageBn + numberOfUsesBn * ckUsdcFee + ckUsdcFee;

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

    const taskContent = tasks
      ?.map((task) => {
        if (task.taskType === "generic") {
          return {
            task_type: "generic",
            title: task.title,
            description: task.description,
            allow_resubmit: task.allowresubmit,
          };
        }
      })
      .filter((item) => item !== undefined);

    if (!taskContent || taskContent.length === 0) {
      toast.error("Invalid subtasks: the minimum number of subtasks is one.");
      return;
    }

    const getOrSetAllowance = setUserSpaceAllowanceIfNeeded({
      unAuthCkUsd: unAuthCkUsdcActor,
      authCkUsdc: authCkUsdcActor,
      spacePrincipal: principal,
      amount: estimatedCost,
      userPrincipal: user.principal,
    });
    await runWithLoading(async () => {
      await toast.promise(getOrSetAllowance, {
        loading: "Checking available funds...",
        success: "Funds allowance granted successfully.",
        error: getErrorWithInfoToast("Failed to allocate funds:"),
      });

      const createNewTaskCall = createNewTask({
        authAtlasSpaceActor,
        numberOfUses: numberOfUsesBn,
        rewardPerUsage: rewardPerUsageBn,
        tasks: taskContent,
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
  };

const formatDisplayDateTime = (dateTimeString: string | null | undefined) => {
  if (!dateTimeString) return { date: 'N/A', time: 'N/A' };
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };
  
  return {
    date: formatDateShortMonth(date),
    time: formatDateShortHour(date)
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

  const {
    ref: startTimeRegisterRef,
    ...startTimeRest
  } = register("startTime");

  const {
    ref: endTimeRegisterRef,
    ...endTimeRest
  } = register("endTime");

 return (
  <form onSubmit={handleSubmit(onSubmit)} className="bg-gradient-to-b from-[#7332F5] to-[#9173FF] overflow-auto min-h-screen flex flex-1 w-full items-center justify-center p-0">
    <div className="flex-col flex-1">
      <div className="relative w-full">
      {spaceBackground ? (
        <img
        src={spaceBackground}
        draggable="false"
        className="w-full h-full object-contain"
        />
      ) : (
        <div className="bg-[#4A0295] rounded-xl m-[3px] w-12 h-12 sm:w-14 sm:h-14"></div>
      )}
        <div className="absolute inset-x-0 bottom-[-60px] sm:bottom-[-90px] lg:bottom-[-110px] flex items-end justify-start px-3 sm:px-6 lg:px-10">
          <div className="w-fit h-fit flex-none">
            {avatarImg ? (
              <img
                src={avatarImg}
                draggable="false"
                className="rounded-lg m-[3px] w-[80px] h-[80px] sm:w-[110px] sm:h-[110px] lg:w-[150px] lg:h-[150px]"
              />
            ) : (
              <div className="bg-[#4A0295] rounded-xl m-[3px] w-12 h-12 sm:w-14 sm:h-14"></div>
            )}
          </div>
          <div className="flex flex-col justify-end ml-2 sm:ml-3 md:ml-4 w-full">
            <h1 className="text-white font-montserrat font-semibold text-base sm:text-lg md:text-xl lg:text-3xl leading-tight mb-2">
              {spaceName || "Space Name"}
            </h1>
            <div className="text-white bg-[#290C69]/20 shadow-md font-montserrat font-medium text-sm sm:text-base lg:text-2xl p-1 sm:p-2 md:p-3 rounded-lg w-full">
              {spaceDescription}
            </div>
          </div>
        </div>
    </div>
    <div className="w-full rounded-3xl my-14 sm:my-20 lg:my-24 p-4 sm:p-8 lg:p-12 relative flex flex-col">
      <div className="w-full h-[1px] bg-white/40 mb-3" />
      <div className="flex flex-1 justify-end">
        <Button
          variant="publish"
          onClick={() => navigate(-1)}
          className="px-2 py-1 font-montserrat font-semibold rounded text-sm sm:text-base"
        >
          <RiCloseLargeLine className="mr-2"/> Close
        </Button>
      </div>
      <div className="w-full h-[1px] bg-white/40 mb-3 my-3" />

      <h2 className="text-white font-medium font-montserrat text-xl sm:text-2xl mb-4">Create new mission</h2>

      <div className="flex flex-col lg:flex-row gap-6 mb-4 flex-grow">
        <div className="flex-1">
          <div className="bg-[#290C69]/20 p-2 rounded mb-6">
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
                <p className="text-white font-semibold font-montserrat w-full md:w-36 pl-0 md:pl-4 mb-1 md:mb-0">Mission Title:</p>
                <input
                  type="text"
                  min="1"
                  max="256"
                  className="flex-1 rounded p-2 bg-[#290C69]/20 text-white w-full"
                  {...register("taskTitle")}
                />
              </div>
              {errors.taskTitle && (
                <p className="text-sm text-red-300 ml-0 md:ml-[163px]">{errors.taskTitle.message?.toString()}</p>
              )}
            </div>
            <label className="text-white font-semibold font-montserrat w-32 md:pl-4 self-start mt-2 md:mt-6">
              Rewards:
            </label>
            <div className="flex flex-col w-full gap-4 bg-[#290C69]/20 p-4 sm:p-6 rounded-2xl mb-6 mt-4 md:mt-0">
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
                  label="XP Reward per usage:"
                  small="1XP == 1ckUSDC"
                  maxDecimalPlaces={DECIMALS}
                  name="rewardPerUsage"
                  errors={errors}
                  className="mb-2"
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
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-[#290C69]/20 rounded-lg p-4 sm:p-6 mb-6 shadow-lg"
                >
                  <h3 className="bg-[#290C69] text-white text-base sm:text-lg font-montserrat font-medium py-1 px-3 sm:px-4 rounded-md inline-block mb-4">
                    Task {index + 1}
                  </h3>
                  <div className="mb-4">
                    <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      {...register(`tasks.${index}.title`)}
                      className="w-full p-3 rounded-lg bg-[#9173FF]/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Enter task title"
                    />
                    {errors?.tasks?.[index]?.title && (
                      <p className="text-sm text-red-300 mt-1">
                        {errors.tasks[index].title?.message?.toString()}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
                      Description
                    </label>
                    <textarea
                      {...register(`tasks.${index}.description`)}
                      className="w-full p-3 rounded-lg bg-[#9173FF]/20 text-white h-24 resize-none placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                      placeholder="Mission description here."
                      rows={5}
                    />
                    {errors?.tasks?.[index]?.description && (
                      <p className="text-sm text-red-300 mt-1">
                        {errors.tasks[index].description?.message?.toString()}
                      </p>
                    )}
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-start flex-wrap gap-3 mb-2">
                      <label className="text-white text-base sm:text-lg font-montserrat font-semibold flex-shrink-0 mr-2">
                        Add-ons
                      </label>
                      <button
                        type="button"
                        className="bg-white/20 text-white px-3 py-1 sm:px-4 sm:py-2 font-montserrat rounded-full font-medium border border-white text-sm sm:text-base"
                      >
                        Generic Task
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-6 justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`allowresubmit-${index}`}
                        {...register(`tasks.${index}.allowresubmit`)}
                        className="form-checkbox h-5 w-5 text-[#9173FF] rounded"
                      />
                      <label htmlFor={`allowresubmit-${index}`} className="text-white font-montserrat text-sm sm:text-lg">
                        Allow re-submission for this subtask if rejected
                      </label>
                    </div>
                    <Button
                      onClick={() => remove(index)}
                      className="text-red-300 text-sm sm:text-base mt-2 sm:mt-0"
                    >
                      Remove
                    </Button>
                  </div>
                  {errors?.tasks?.[index]?.allowresubmit?.message && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {errors.tasks[index].allowresubmit.message.toString()}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-6">
        <Button
          className="text-white bg-white/20 px-3 py-1 rounded font-semibold text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0"
          onClick={() =>
            append({
              taskType: "generic",
              title: "",
              description: "",
              allowresubmit: false,
            })
          }
        >
          Task <FaPlus className="ml-2"/>
        </Button>
        <Button
          variant="saveDraft"
          className="font-montserrat px-3 py-1 font-semibold text-sm sm:text-base w-full sm:w-auto mb-2 sm:mb-0"
          onClick={() => toast("Draft saving not yet implemented")}
        >
          Save draft
        </Button>
        <Button
          variant="publish"
          className="font-montserrat px-3 py-1 font-semibold text-sm sm:text-base w-full sm:w-auto"
        >
          Publish
        </Button>
      </div>
    </div>
    </div>
  </form>
  );
};

export default CreateNewTaskModal;
