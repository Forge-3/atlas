import React from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

interface DiscordTaskProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  index: number;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
}

const DiscordTask = <TFormValues extends FieldValues>({
  register,
  index,
  errors,
  maxTitleLength,
  maxDescriptionLength,
}: DiscordTaskProps<TFormValues>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleError = (errors?.tasks as any[])?.[index]?.title?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const descriptionError = (errors?.tasks as any[])?.[index]?.description
    ?.message;

  return (
    <div className="flex flex-col ml-4 mt-2">
      <p className="text-gray-600">Title:</p>
      <input
        type="text"
        maxLength={maxTitleLength}
        {...register(`tasks.${index}.title` as Path<TFormValues>)}
        className={`border-2 p-2 rounded-xl ${
          descriptionError && "border-red-500"
        }`}
      />
      {titleError && <span className="text-red-500">{titleError}</span>}

      <p className="text-gray-600">Description:</p>
      <textarea
        maxLength={maxDescriptionLength}
        {...register(`tasks.${index}.description` as Path<TFormValues>)}
        className={`border-2 p-2 rounded-xl ${
          descriptionError && "border-red-500"
        }`}
      ></textarea>
      {descriptionError && (
        <span className="text-red-500">{descriptionError}</span>
      )}
    </div>
  );
};

export default DiscordTask;
