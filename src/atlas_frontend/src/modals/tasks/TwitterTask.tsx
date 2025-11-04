import React from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

interface TwitterTaskProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  index: number;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  xPostLink?: string;
}

const TwitterTask = <TFormValues extends FieldValues>({
  register,
  index,
  errors,
  maxTitleLength,
  maxDescriptionLength,
}: TwitterTaskProps<TFormValues>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleError = (errors?.tasks as any[])?.[index]?.title?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const descriptionError = (errors?.tasks as any[])?.[index]?.description?.message;

  return (
    <>
      <div className="mb-4">
        <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
          Task Title
        </label>
        <input
          type="text"
          maxLength={maxTitleLength}
          {...register(`tasks.${index}.title` as Path<TFormValues>)}
          className={`w-full p-3 rounded-lg bg-primary/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
            titleError ? "ring-2 ring-red-500" : ""
          }`}
          placeholder="Enter task title."
        />
        {titleError && (
          <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
            {titleError.toString()}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
          Description
        </label>
        <textarea
          maxLength={maxDescriptionLength}
          {...register(`tasks.${index}.description` as Path<TFormValues>)}
          className={`w-full p-3 rounded-lg bg-primary/20 text-white h-24 resize-none md:overflow-hidden placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
            descriptionError ? "ring-2 ring-red-500" : ""
          }`}
          placeholder="Mission description here."
          rows={3}
        />
        {descriptionError && (
          <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
            {descriptionError.toString()}
          </p>
        )}
        <p className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">X post link:</p>
      <input
        type="text"
        {...register(`tasks.${index}.xPostLink` as Path<TFormValues>)}
        className="w-full p-3 rounded-lg bg-primary/20 text-white resize-none md:overflow-hidden placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
        placeholder="Link to x post."
      />
      </div>
    </>
  );
};

export default TwitterTask;