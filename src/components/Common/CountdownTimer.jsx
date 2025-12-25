import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        if (!targetDate) return {};
        
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!targetDate || Object.keys(timeLeft).length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
            <span className="w-4 text-center">{timeLeft.days}d</span>:
            <span className="w-4 text-center">{timeLeft.hours}h</span>:
            <span className="w-4 text-center">{timeLeft.minutes}m</span>:
            <span className="w-4 text-center">{timeLeft.seconds}s</span>
        </div>
    );
};

export default CountdownTimer;
