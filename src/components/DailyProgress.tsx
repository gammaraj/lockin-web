"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DailyGoalData } from "@/lib/types";
import { loadStreakHistory } from "@/lib/storage";
import type { StreakHistory } from "@/lib/types";

interface DailyProgressProps {
  dailyGoalData: DailyGoalData;
  dailyGoal: number;
}

export default function DailyProgress({
  dailyGoalData,
  dailyGoal,
}: DailyProgressProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [streakHistory, setStreakHistory] = useState<StreakHistory>({ days: {} });

  const progressPercent = Math.min(
    100,
    (dailyGoalData.sessionCount / dailyGoal) * 100
  );
  const goalMet = dailyGoalData.sessionCount >= dailyGoal;

  useEffect(() => {
    if (showCalendar) {
      loadStreakHistory().then(setStreakHistory);
    }
  }, [showCalendar, dailyGoalData]);

  const getStatusText = () => {
    if (goalMet) return "🎉 Daily goal achieved! Keep going!";
    if (dailyGoalData.sessionCount === 0)
      return "Start a session to begin your streak!";
    const remaining = dailyGoal - dailyGoalData.sessionCount;
    return `${remaining} more session${remaining > 1 ? "s" : ""} to reach your goal!`;
  };

  return (
    <section className="px-3 py-2" aria-labelledby="daily-progress-heading">
      <div
        id="dailyGoalProgress"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
      >
        {/* Sessions counter */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              id="daily-progress-heading"
              className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1"
            >
              Today&apos;s Sessions
            </h2>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {dailyGoalData.sessionCount}
              <span className="text-gray-400">/</span>
              {dailyGoal}
            </div>
          </div>
          <div
            className="text-center cursor-pointer"
            title="Click to view calendar"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">
              Streak
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              🔥 {dailyGoalData.streak} days
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3 border border-gray-300 dark:border-gray-600"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goalMet ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status text */}
        <div
          className={`text-sm text-center font-medium ${
            goalMet
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {getStatusText()}
        </div>

        {/* Calendar View */}
        {showCalendar && (
          <CalendarView
            calendarDate={calendarDate}
            setCalendarDate={setCalendarDate}
            streakHistory={streakHistory}
          />
        )}
      </div>
    </section>
  );
}

// ===== Calendar Sub-Component =====

interface CalendarViewProps {
  calendarDate: Date;
  setCalendarDate: React.Dispatch<React.SetStateAction<Date>>;
  streakHistory: StreakHistory;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarView({
  calendarDate,
  setCalendarDate,
  streakHistory,
}: CalendarViewProps) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const prevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = new Date(year, month, 1).getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const emptyCells = Array.from({ length: startingDayOfWeek });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayStyle = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cellDate = new Date(year, month, day);
    const isFuture = cellDate > today;
    const isToday = dateStr === todayStr;
    const dayData = streakHistory.days[dateStr];

    let bg = "#e5e7eb";
    let color = "#6b7280";
    let title = "";

    if (isFuture) {
      bg = "#f3f4f6";
      color = "#9ca3af";
    } else if (dayData) {
      const sessions = dayData.sessionCount || 0;
      if (dayData.goalMet) {
        bg = "#22c55e";
        color = "#ffffff";
        title = `${sessions} sessions (Goal met!)`;
      } else if (sessions > 0) {
        bg = "#fb923c";
        color = "#ffffff";
        title = `${sessions} sessions`;
      }
    }

    return {
      backgroundColor: bg,
      color,
      boxShadow: isToday ? "0 0 0 2px #3b82f6" : undefined,
      title,
    };
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8" />
        ))}
        {dayCells.map((day) => {
          const style = getDayStyle(day);
          return (
            <div
              key={day}
              className="calendar-day"
              style={style}
              title={style.title}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Goal met</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600" />
          <span>No activity</span>
        </div>
      </div>
    </div>
  );
}
