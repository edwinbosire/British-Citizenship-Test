import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  secondsLeft: number;
  setSecondsLeft: React.Dispatch<React.SetStateAction<number>>;
  onTimeUp: () => void;
}

export const Timer: React.FC<TimerProps> = ({ secondsLeft, setSecondsLeft, onTimeUp }) => {
  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }

    const timerId = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsLeft, onTimeUp, setSecondsLeft]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsLeft < 300; // Less than 5 minutes

  return (
    <div className={`flex items-center gap-2 font-mono text-lg font-semibold ${isLowTime ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
      <Clock className="w-5 h-5" />
      {formatTime(secondsLeft)}
    </div>
  );
};
