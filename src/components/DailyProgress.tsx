"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DailyGoalData } from "@/lib/types";
import { loadStreakHistory } from "@/lib/storage";
import type { StreakHistory } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

interface DailyProgressProps {
  dailyGoalData: DailyGoalData;
  dailyGoal: number;
}

export default function DailyProgress({
  dailyGoalData,
  dailyGoal,
}: DailyProgressProps) {
  const { loading: authLoading } = useAuth();
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [streakHistory, setStreakHistory] = useState<StreakHistory>({ days: {} });

  const progressPercent = Math.min(
    100,
    (dailyGoalData.sessionCount / dailyGoal) * 100
  );
  const goalMet = dailyGoalData.sessionCount >= dailyGoal;

  useEffect(() => {
    if (authLoading) return;
    if (showCalendar) {
      loadStreakHistory().then(setStreakHistory);
    }
  }, [showCalendar, dailyGoalData, authLoading]);

  const getStatusText = () => {
    if (goalMet) return "🎉 Daily goal achieved! Keep going!";
    if (dailyGoalData.sessionCount === 0)
      return "Start a session to begin your streak!";
    const remaining = dailyGoal - dailyGoalData.sessionCount;
    return `${remaining} more session${remaining > 1 ? "s" : ""} to reach your goal!`;
  };

  return (
    <section className="px-4 py-2" aria-labelledby="daily-progress-heading">
      <div
        id="dailyGoalProgress"
        className="bg-gradient-to-br from-white to-slate-50/80 dark:from-[#131d30] dark:to-[#131d30] rounded-xl shadow-sm border border-slate-200/80 dark:border-[#243350] p-4"
      >
        {/* Sessions counter */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              id="daily-progress-heading"
              className="text-base font-bold text-slate-800 dark:text-slate-50 mb-1"
            >
              Today&apos;s Sessions
            </h2>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
              {dailyGoalData.sessionCount}
              <span className="text-slate-400">/</span>
              {dailyGoal}
            </div>
          </div>
          <div
            className="text-center cursor-pointer"
            title="Click to view calendar"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-1 font-medium">
              Streak
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 dark:bg-[#1a2d4a] dark:from-transparent dark:to-transparent text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 dark:border-[#243350] hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition-colors">
              🔥 {dailyGoalData.streak} days
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full bg-slate-100 dark:bg-[#1a2d4a] rounded-full h-3 mb-3 border border-slate-200/80 dark:border-[#243350] overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goalMet ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-blue-400 to-blue-600"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status text */}
        <div
          className={`text-sm text-center font-medium ${
            goalMet
              ? "text-green-600 dark:text-green-300"
              : "text-slate-600 dark:text-slate-300"
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
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#243350]">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-100">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} className="w-11 h-11" />
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
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 text-sm text-slate-500 dark:text-slate-300">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Goal met</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-400" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600" />
          <span>No activity</span>
        </div>
      </div>
    </div>
  );
}
