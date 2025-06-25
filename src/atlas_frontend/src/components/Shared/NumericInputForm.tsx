import React from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

interface NumericInputFormProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  label?: string;
  small?: string;
  name: Path<TFormValues>;
}

const NumericInputForm = <TFormValues extends FieldValues>({
  register,
  label,
  small,
  name,
  errors,
}: NumericInputFormProps<TFormValues>) => {
  return (
    <div className="mb-4">
      {label && <p className="text-gray-600">{label}</p>}
      <small className="text-gray-600">{small}</small>
      <input
        type="number"
        min="1"
        step="1"
        autoComplete="off"
        {...register(name, {
          valueAsNumber: true,
          validate: (value) => {
            if (!(Number.isInteger(value) && value >= 0)) {
              return "Must be a non-negative integer";
            }
            if (isNaN(value)) {
              return "Number can't be empty";
            }
            return true;
          },
        })}
        onKeyDown={(e) => {
          if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
            e.preventDefault();
          }
        }}
        className={`border-2 p-2 rounded-xl w-full ${
            errors?.[name]?.message && "border-red-500"
          }`}
      />
      {errors?.[name]?.message && (
        <p className="text-red-500 mt-1">
          {errors?.[name]?.message.toString()}
        </p>
      )}
    </div>
  );
};

export default NumericInputForm;
