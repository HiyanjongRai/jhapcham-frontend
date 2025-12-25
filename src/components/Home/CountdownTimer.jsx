import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    if (!targetDate) return null;
    
    const difference = new Date(targetDate) - new Date();
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
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

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
};

export default CountdownTimer;
