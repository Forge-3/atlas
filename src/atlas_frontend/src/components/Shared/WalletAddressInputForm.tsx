import React from "react";
import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";

interface WalletAddressInputFormProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  label?: string;
  name: Path<TFormValues>;
  small?: string;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}

const WalletAddressInputForm = <TFormValues extends FieldValues>({
  register,
  label,
  name,
  small,
  errors,
  className,
  placeholder,
  maxLength
}: WalletAddressInputFormProps<TFormValues>) => {
  return (
    <div>
      {label && <p className="text-white">{label}</p>}
      {small && <small className="text-white">{small}</small>}
      <input
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        maxLength={maxLength}
        {...register(name)}
        className={`p-2 rounded-xl w-full ${className ?? ""} ${
          errors?.[name]?.message ? "!border-2 border-red-500" : ""
        }`}
      />
      {errors?.[name]?.message && (
        <p className="text-red-500 mt-1">{errors[name]?.message?.toString()}</p>
      )}
    </div>
  );
};

export default WalletAddressInputForm;
