import React from "react";
import { parseUnits } from "ethers";
interface DecimalInputFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any;
  label?: string;
  maxDecimalPlaces?: number;
  small?: string;
  name: string;
}

export default function DecimalInputForm({
  register,
  label,
  maxDecimalPlaces,
  small,
  name,
}: DecimalInputFormProps) {
  return (
    <>
      {label && <p className="text-gray-600">{label}</p>}
      <small className="text-gray-600">{small}</small>
      <input
        type="text"
        {...register(name, {
          required: "This field is required",
          pattern: {
            value: /^(?!0\d)\d*(\.\d+)?$/,
            message: "Enter a valid positive decimal number",
          },
          validate: (value: string) => {
            if (!(parseFloat(value) > 0)) {
              return "Number must be greater than 0";
            } else if (!parseUnits(value, maxDecimalPlaces)) {
              return "Number have to many decimals";
            }
            return true;
          },
        })}
        onKeyDown={(e) => {
          if (
            ["-", ",", "e", "E"].includes(e.key) ||
            (!/[0-9.]$/.test(e.key) && e.key.length === 1 && !e.ctrlKey)
          ) {
            return e.preventDefault();
          }
        }}
        inputMode="decimal"
        className="border-2 p-2 rounded-xl w-full mb-4"
      />
    </>
  );
}
