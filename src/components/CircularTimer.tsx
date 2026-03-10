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
  const circumference = 2 * Math.PI * 45;
  const progress = totalDuration > 0 ? (totalDuration - remainingTime) / totalDuration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative mx-auto my-0" style={{ width: 'min(230px, 50vw)', height: 'min(230px, 50vw)' }}>
      {/* SVG ring */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="50" cy="50" r="42"
          fill={isBreak ? "rgba(16,185,129,0.08)" : "rgba(59,130,246,0.08)"}
          stroke="none"
        />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-500"
          strokeWidth="3.5"
          opacity="0.8"
        />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={isBreak ? "var(--success-green)" : "var(--primary-blue)"}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Center text overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full flex flex-col items-center justify-center text-center bg-white dark:bg-[#131d30] border-2 border-slate-200 dark:border-slate-500 shadow-lg"
          style={{ width: 'min(165px, 36vw)', height: 'min(165px, 36vw)' }}
        >
          <div className="text-xs font-bold mb-0.5 text-gray-700 dark:text-gray-100">
            {isBreak ? "🎉 " : ""}
            {label}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">
            {displayTime}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-300 mt-0.5">
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}
