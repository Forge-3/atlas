import React, { forwardRef } from "react";

export type DateTimeDisplay = {
  date: string;
  time: string;
};

type DateTimeDisplayPickerProps = {
  label: string;
  icon?: React.ReactNode;
  formatted: DateTimeDisplay;
  onClick: () => void;
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "ref">;
  errorMessage?: string;
  className?: string;
};

const DateTimeDisplayPicker = forwardRef<HTMLInputElement, DateTimeDisplayPickerProps>(
  ({ label, icon, formatted, onClick, inputProps, errorMessage, className }, ref) => {
    return (
      <div className={`flex flex-col w-full md:flex-none md:w-auto ${className || ''}`}>
        <div
          className="flex flex-col md:flex-row gap-2 font-montserrat items-start md:items-center cursor-pointer relative w-full"
          onClick={onClick}
        >
          <div className="flex gap-2 items-center flex-none">
            {icon}
            <p className="text-base font-medium whitespace-nowrap">{label}</p>
          </div>
          <div className="flex flex-1 gap-2 items-center w-full md:flex-none md:w-auto">
            <div className="bg-[#7332F5] text-base px-3 py-2 rounded-md flex-grow text-center min-w-0">
              {formatted.date}
            </div>
            <div className="bg-[#4A0295] text-base px-2 py-2 rounded-md flex-shrink-0 whitespace-nowrap min-w-24 text-center">
              {formatted.time}
            </div>
          </div>
          <input
            type="datetime-local"
            ref={ref}
            {...inputProps}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`${label} picker`}
          />
        </div>
        {errorMessage && (
          <div className="text-red-300 text-sm mt-1 ml-0 md:ml-[50px]">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

DateTimeDisplayPicker.displayName = "DateTimeDisplayPicker";

export default DateTimeDisplayPicker;
