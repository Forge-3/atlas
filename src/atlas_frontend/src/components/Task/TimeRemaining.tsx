import React, { useEffect, useState } from "react";
import { formatDuration } from "../../utils/date";

interface TimeRemainingProps {
  endTime: bigint;
  currentTime: number;
}

const TimeRemaining: React.FC<TimeRemainingProps> = ({ endTime, currentTime }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>(() => {
    const remainingSeconds = Number(endTime) - currentTime;
    return formatDuration(remainingSeconds);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const remainingSeconds = Number(endTime) - Math.floor(Date.now() / 1000);
      setTimeRemaining(formatDuration(remainingSeconds));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <h3 className="font-montserrat text-light text-[20px] md:text-h3 font-semibold">
      {timeRemaining}
    </h3>
  );
};

export default TimeRemaining;