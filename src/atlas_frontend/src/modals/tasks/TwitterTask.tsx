import React from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import type { XAnswerFormat } from "../../../../declarations/atlas_space/atlas_space.did";

const getXAnswerFormatKey = (format: XAnswerFormat): string =>
  Object.keys(format)[0];
const answerFormatDescriptions: Record<string, string> = {
  Like: "User have to like the post",
  Repost: "User have to repost the post",
};

interface TwitterTaskProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  index: number;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  xPostLink?: string;
  xAnswerFormat?: string;
}

const xAnswerFormats: XAnswerFormat[] = [
  { Like: null },
  { Repost: null },
];

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
        <label className="text-white text-base sm:text-lg font-montserrat font-semibold flex-shrink-0 mr-2">
          X task type:
        </label>
        <select
          {...register(`tasks.${index}.xAnswerFormat` as Path<TFormValues>)}
          className="w-full p-3 pr-10 mb-1 rounded-lg bg-primary text-white font-montserrat cursor-pointer appearance-none focus:outline-none"
        >
          {xAnswerFormats.map((format) => {
            const key = getXAnswerFormatKey(format);
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