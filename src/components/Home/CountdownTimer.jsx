import React, { useState, useEffect, memo, useCallback } from 'react';

const CountdownTimer = memo(({ targetDate }) => {
  // ⚡ PERFORMANCE: Memoize calculation function
  const calculateTimeLeft = useCallback((date) => {
    if (!date) return null;
    
    const difference = new Date(date) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return timeLeft;
  }, []);

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, calculateTimeLeft]);

  if (!timeLeft) return null;

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <div className="countdown-timer">
      <span className="timer-segment">
        <strong>{days}</strong>d
      </span>
      <span className="timer-segment">
        <strong>{String(hours).padStart(2, '0')}</strong>h
      </span>
      <span className="timer-segment">
        <strong>{String(minutes).padStart(2, '0')}</strong>m
      </span>
      <span className="timer-segment">
        <strong>{String(seconds).padStart(2, '0')}</strong>s
      </span>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

export default CountdownTimer;
