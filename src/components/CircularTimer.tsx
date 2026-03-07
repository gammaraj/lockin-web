"use client";

import React from "react";

interface CircularTimerProps {
  remainingTime: number;
  totalDuration: number;
  label: string;
  statusText: string;
  displayTime: string;
  isBreak: boolean;
}

export default function CircularTimer({
  remainingTime,
  totalDuration,
  label,
  statusText,
  displayTime,
  isBreak,
}: CircularTimerProps) {
  const circumference = 315;
  const progress = totalDuration > 0 ? (totalDuration - remainingTime) / totalDuration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="circular-timer-container my-2">
      <div className="circular-timer">
        <svg className="timer-svg" viewBox="0 0 100 100">
          {/* Inner background circle */}
          <circle
            className={`timer-inner-bg ${isBreak ? "break" : ""}`}
            cx="50"
            cy="50"
            r="42"
          />
          {/* Background circle */}
          <circle className="timer-circle-bg" cx="50" cy="50" r="45" />
          {/* Progress circle */}
          <circle
            className={`timer-circle-progress ${isBreak ? "break" : ""}`}
            cx="50"
            cy="50"
            r="45"
            style={{ strokeDashoffset: offset }}
          />
        </svg>
        <div className="timer-content">
          <div className="text-base font-bold mb-1 text-gray-700 dark:text-gray-200">
            {isBreak ? "🎉 " : ""}
            {label}
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
            {displayTime}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
