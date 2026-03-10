"use client";

import React from "react";

interface TimerControlsProps {
  isRunning: boolean;
  onStartPause: () => void;
  onReset: () => void;
}

export default function TimerControls({
  isRunning,
  onStartPause,
  onReset,
}: TimerControlsProps) {
  return (
    <div
      className="flex justify-center gap-3 my-1"
      role="group"
      aria-label="Timer control buttons"
    >
      {/* Start / Pause */}
      <button
        onClick={onStartPause}
        className={`pause-button w-11 h-11 ${isRunning ? "running" : ""}`}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
        title={isRunning ? "Pause" : "Start focus session"}
      >
        {isRunning ? (
          // Pause icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          // Play icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010.049 9.9v4.2a1 1 0 001.506.864l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="reset-button w-11 h-11"
        aria-label="Reset timer"
        title="Reset current session"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
