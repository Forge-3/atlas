import React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import Button from "../components/Shared/Button";
import * as yup from "yup";
import { FiPlus } from "react-icons/fi";
import DecimalInputForm from "../components/Shared/DecimalInputForm";

interface CreateNewTaskFormInput {
  numberOfUses: number;
  rewardPerUsage: number;
  tasks?: {
    taskType: string;
    title: string;
    description: string;
  }[];
}

const taskSchema = yup.object({
  taskType: yup.string().required(),
  title: yup.string().trim().max(48).required(),
  description: yup.string().max(512).trim().min(2).required(),
});

const schema = yup.object({
  numberOfUses: yup.number().min(1).required(),
  rewardPerUsage: yup.number().min(0.1).required(),
  tasks: yup.array().of(taskSchema).min(1),
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GenericTask = ({ register, index }: { register: any; index: number }) => {
  return (
    <div className="flex flex-col ml-4 mt-2">
      <p className="text-gray-600">Title:</p>
      <input
        type="text"
        {...register(`tasks.${index}.title`)}
        className="border-2 p-2 rounded-xl"
      />
      <p className="text-gray-600">Description:</p>
      <textarea
        {...register(`tasks.${index}.description`)}
        className="border-2 p-2 rounded-xl"
      ></textarea>
    </div>
  );
};

const CreateNewTaskModal = () => {
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
  const numberOfUses = watch("numberOfUses");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rewardPerUser = watch("rewardPerUser" as any);
  const estimatedCost = numberOfUses * parseFloat(rewardPerUser);

  const onSubmit: SubmitHandler<CreateNewTaskFormInput> = async (data) => {
    console.log("All tasks:", data);
  };

  console.log({errors})

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto">
        <div className="flex flex-col rounded-xl bg-white p-[20px] gap-[10px] w-[40rem]">
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
              <FiPlus /> Add task
            </Button>
          </h2>
          <div className="border-l-2 pl-2 border-[#9173FF] border-dashed lex items-center justify-between font-semibold gap-2">
            <p className="text-gray-600">Number of task uses:</p>
            <input
              type="number"
              {...register(`numberOfUses`)}
              className="border-2 p-2 rounded-xl w-full mb-4"
            />
            <div className="relative">
              <DecimalInputForm
                register={register}
                label="XP Reward per usage:"
                small="1XP == 1ckUSDC"
                maxDecimalPlaces={4}
                name="rewardPerUser"
              />
            </div>

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
                      <GenericTask register={register} index={index} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            <div className="justify-between font-semibold flex items-center justify-center gap-2">
              Estimated cost: {isNaN(estimatedCost) ? 0 : estimatedCost}
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
