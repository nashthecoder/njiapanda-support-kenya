import { useEffect, useState } from "react";

interface SautiTimerProps {
  running: boolean;
}

const SautiTimer = ({ running }: SautiTimerProps) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className="font-mono text-xs text-muted-foreground">
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
};

export default SautiTimer;
