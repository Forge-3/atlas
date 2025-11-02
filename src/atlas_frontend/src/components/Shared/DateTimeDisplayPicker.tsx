import React, { forwardRef, useEffect, useState } from "react";

export type DateTimeDisplay = {
  date: string;
  time: string;
};

type FakeChangeEvent = { target: { name?: string; value: string } };

type DateTimeDisplayPickerProps = {
  label: string;
  icon?: React.ReactNode;
  formatted: DateTimeDisplay;
  onClick: () => void;
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "ref">;
  errorMessage?: string;
  className?: string;
};

const toLocalDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA");
};

const toLocalTime = (timeStr: string): string => {
  if (!timeStr) return "";
  const [timePart, dayPeriod] = timeStr.trim().split(" ");
  const [hStr, mStr] = timePart.split(":");
  let hours = Number(hStr);
  const minutes = Number(mStr);

  if (dayPeriod?.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (dayPeriod?.toUpperCase() === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}`;
};

const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);

const DateTimeDisplayPicker = forwardRef<HTMLInputElement, DateTimeDisplayPickerProps>(
  function DateTimeDisplayPicker(
    { label, icon, formatted, onClick, inputProps, errorMessage, className }, ref
  ) {
    const [date, setDate] = useState<string>(toLocalDate(formatted.date));
    const [time, setTime] = useState<string>(toLocalTime(formatted.time));

    useEffect(() => {
      if (!isFirefox) return;
      const v = (inputProps?.value as string) ?? "";
      if (!v) return;
      const date = v.split("T")[0] || "";
      const time = (v.split("T")[1] || "").slice(0, 5);
      setDate(date);
      setTime(time);
    }, [inputProps?.value]);

    useEffect(() => {
      if (!isFirefox) return;
      setDate(toLocalDate(formatted.date));
      setTime(toLocalTime(formatted.time));
    }, [formatted]);

    const merged = date && time ? `${date}T${time}` : "";

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
          {isFirefox ? (
            <div className="flex flex-1 gap-2 items-center w-full md:flex-none md:w-auto">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  const v = e.target.value;
                  setDate(v);
                  (inputProps?.onChange as (e: FakeChangeEvent) => void)?.({ target: { name: inputProps?.name, value: v && time ? `${v}T${time}` : "" } });
                }}
                className="w-full rounded-md bg-background p-2 text-white text-center focus:outline-none"
                aria-label={`${label} date`}
              />
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  const v = e.target.value;
                  setTime(v);
                  (inputProps?.onChange as (e: FakeChangeEvent) => void)?.({ target: { name: inputProps?.name, value: date && v ? `${date}T${v}` : "" } });
                }}
                className="w-28 rounded-md bg-dark p-2 text-white text-center focus:outline-none"
                aria-label={`${label} time`}
              />
              <input type="hidden" name={inputProps?.name} value={merged} ref={ref} readOnly />
            </div>
          ) : (
            <div className="flex flex-1 gap-2 items-center w-full md:flex-none md:w-auto">
              <div className="bg-background text-base px-3 py-2 rounded-md flex-grow text-center min-w-0">
                {formatted.date}
              </div>
              <div className="bg-dark text-base px-2 py-2 rounded-md flex-shrink-0 whitespace-nowrap min-w-24 text-center">
                {formatted.time}
              </div>
              <input
                type="datetime-local"
                ref={ref}
                {...inputProps}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label={`${label} picker`}
              />
            </div>
          )}
        </div>
        {errorMessage && (
          <div className="text-red-300 font-montserrat font-medium text-sm mt-1">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

export default DateTimeDisplayPicker;
