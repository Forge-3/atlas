import React from "react";
import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";

interface DecimalInputFormProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  label?: string;
  maxDecimalPlaces?: number;
  small?: string;
  name: Path<TFormValues>;
  className?: string | undefined,
  placeholder?: string,
  maxValue?: number;
}

const DecimalInputForm = <TFormValues extends FieldValues>({
  register,
  label,
  maxDecimalPlaces = 18,
  small,
  name,
  errors,
  className,
  placeholder,
}: DecimalInputFormProps<TFormValues>) => {
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        {label && <p className="text-white mx-2 font-montserrat w-32">{label}</p>}
        <div className="flex flex-col flex-1">
          <input
            type="text"
            autoComplete="off"
            placeholder={placeholder}
            {...register(name, {
              required: "This field is required",
              pattern: {
                value: /^(?!0\d)\d*(\.\d+)?$/,
                message: "Enter a valid positive decimal number",
              },
            })}
            onInput={(e) => {
              const input = e.target as HTMLInputElement;
              const decimalValue = input.value.indexOf(".");
              if (
                decimalValue !== -1 &&
                input.value.length - decimalValue - 1 > (maxDecimalPlaces || 0)
              ) {
                input.value = input.value.slice(
                  0,
                  decimalValue + (maxDecimalPlaces || 0) + 1
                );
              }
              const parts = input.value.split('.');
              parts[0] = parts[0].replace(/^0+(?!$)/, '');
              input.value = parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];
            }}
            onKeyDown={(e) => {
              if (
                ["-", ",", "e", "E"].includes(e.key) ||
                (!/[0-9.]$/.test(e.key) && e.key.length === 1 && !e.ctrlKey)
              ) {
                return e.preventDefault();
              }
            }}
            inputMode="decimal"
            className={`rounded p-2 bg-[#6f55c2] text-white  ${
              errors?.[name]?.message && "border-red-500"
            } ${className ?? ""}`}
          />
          {small && <small className="text-white text-sm w-32">{small}</small>}
          {errors?.[name]?.message && (
            <p className="text-red-500 mt-1">
              {errors?.[name]?.message.toString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DecimalInputForm