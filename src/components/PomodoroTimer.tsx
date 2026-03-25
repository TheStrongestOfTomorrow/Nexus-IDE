import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft === 0) setIsActive(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-2 px-2 border-l border-nexus-border">
      <Timer size={12} className={isActive ? "text-nexus-accent animate-pulse" : "text-nexus-text-muted"} />
      <span className="text-[10px] font-mono tabular-nums min-w-[35px]">{formatTime(timeLeft)}</span>
      <button onClick={toggleTimer} className="hover:text-white transition-colors">
        {isActive ? <Pause size={10} /> : <Play size={10} />}
      </button>
      <button onClick={resetTimer} className="hover:text-white transition-colors">
        <RotateCcw size={10} />
      </button>
    </div>
  );
}
