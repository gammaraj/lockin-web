"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";
import DailyProgress from "@/components/DailyProgress";
import SettingsPanel from "@/components/SettingsPanel";
import TaskList from "@/components/TaskList";
import AuthForm from "@/components/AuthForm";
import UserMenu from "@/components/UserMenu";
import { useAuth } from "@/components/AuthProvider";
import { loadTasks, saveTasks } from "@/lib/storage";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const timer = useTimer();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);

  const isRunning = timer.status === "running";
  const displayTime =
    timer.status === "idle"
      ? formatTime(timer.settings.workDuration)
      : formatTime(timer.remainingTime);

  // Keep ref in sync
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);

  // Register session-complete callback to increment active task sessions + time
  useEffect(() => {
    timer.setOnSessionCompleteCallback(() => {
      const taskId = activeTaskIdRef.current;
      if (!taskId) return;
      const elapsed = timer.settings.workDuration; // full session completed
      loadTasks().then((tasks) => {
        const updated = tasks.map((t) =>
          t.id === taskId
            ? { ...t, sessions: t.sessions + 1, timeSpent: (t.timeSpent || 0) + elapsed }
            : t
        );
        saveTasks(updated);
        window.dispatchEvent(new Event("tempo-tasks-updated"));
      });
    });
    return () => timer.setOnSessionCompleteCallback(null);
  }, [timer]);

  const handleStartPause = () => {
    if (timer.status === "break") return;
    if (isRunning) {
      timer.pause();
    } else {
      timer.start();
    }
  };

  const handleStartTask = useCallback((taskId: string) => {
    setActiveTaskId(taskId);
    if (timer.status !== "running" && timer.status !== "break") {
      timer.start();
    }
  }, [timer]);

  /** Complete the active task: save elapsed time, stop the timer, deselect */
  const handleCompleteTask = useCallback((taskId: string) => {
    const elapsed = timer.getElapsedWorkTime();
    if (elapsed > 0) {
      loadTasks().then((tasks) => {
        const updated = tasks.map((t) =>
          t.id === taskId ? { ...t, timeSpent: (t.timeSpent || 0) + elapsed } : t
        );
        saveTasks(updated);
        window.dispatchEvent(new Event("tempo-tasks-updated"));
      });
    }
    if (timer.status === "running" || timer.status === "paused") {
      timer.reset();
    }
    setActiveTaskId(null);
  }, [timer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-white dark:bg-neutral-950">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-neutral-800">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" fill="none"/>
                  <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="81.7" strokeDashoffset="20.4" strokeLinecap="round" transform="rotate(-90 16 16)"/>
                  <path d="M18 6L12 17h5l-2 10 8-13h-6l3-8z" fill="white"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Tempo</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Focus timer & productivity tracker</p>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center min-h-screen p-3 pt-4 sm:p-4 sm:pt-8">
      <div className="w-full max-w-[960px] flex flex-col lg:flex-row gap-4 sm:gap-5">
        {/* Timer column */}
        <div className="w-full lg:w-[420px] lg:flex-shrink-0">
          <div className="bg-white/80 dark:bg-gray-900 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-gray-800 overflow-visible relative">
            {/* Header */}
            <header
              className="flex items-center justify-between px-5 py-5 text-white rounded-t-2xl"
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              }}
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Timer ring */}
                    <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" strokeOpacity="0.3" fill="none"/>
                    {/* Progress arc ~ 75% */}
                    <circle cx="16" cy="16" r="13" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="81.7" strokeDashoffset="20.4" strokeLinecap="round" transform="rotate(-90 16 16)"/>
                    {/* Lightning bolt */}
                    <path d="M18 6L12 17h5l-2 10 8-13h-6l3-8z" fill="white"/>
                  </svg>
                </div>
                <h1 className="text-xl font-bold ml-3">Tempo</h1>
              </div>

              <div className="flex items-center gap-1">
              <UserMenu />
              <button
                onClick={() => setShowSettings(true)}
                className="text-white hover:text-gray-200 transition p-1.5 rounded-full hover:bg-white/10"
                aria-label="Open settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              </div>
            </header>

            {/* Active task indicator */}
            {activeTaskId && (
              <div className="px-4 pt-3 pb-0">
                <ActiveTaskBanner
                  taskId={activeTaskId}
                  onClear={() => setActiveTaskId(null)}
                  isRunning={isRunning}
                />
              </div>
            )}

            {/* Main content */}
            <div className="bg-white/60 dark:bg-gray-900 backdrop-blur-sm p-4">
              <CircularTimer
                remainingTime={timer.remainingTime}
                totalDuration={
                  timer.isBreakMode
                    ? timer.settings.breakDuration
                    : timer.settings.workDuration
                }
                label={timer.label}
                statusText={timer.statusText}
                displayTime={
                  timer.status === "break"
                    ? formatTime(timer.remainingTime)
                    : displayTime
                }
                isBreak={timer.isBreakMode}
              />

              <TimerControls
                isRunning={isRunning}
                onStartPause={handleStartPause}
                onReset={timer.reset}
              />
            </div>

            {timer.lastQuote && (
              <div className="px-4 pb-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-slate-800/40 dark:from-transparent dark:to-transparent rounded-xl p-3.5 border border-blue-100/80 dark:border-slate-700 text-center">
                  <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed">
                    &ldquo;{timer.lastQuote}&rdquo;
                  </p>
                </div>
              </div>
            )}

            <DailyProgress
              dailyGoalData={timer.dailyGoalData}
              dailyGoal={timer.settings.dailyGoal}
            />

            <div className="h-2" />
          </div>
        </div>

        {/* Task list column */}
        <div className="w-full lg:flex-1">
          <TaskList
            activeTaskId={activeTaskId}
            onSelectTask={setActiveTaskId}
            onStartTask={handleStartTask}
            onCompleteTask={handleCompleteTask}
            isTimerRunning={isRunning}
          />
        </div>

        <div className="sr-only" aria-live="polite" aria-atomic="true" />
      </div>

      {showSettings && (
        <SettingsPanel
          settings={timer.settings}
          onSave={timer.saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

/** Small banner showing which task the timer is focused on */
function ActiveTaskBanner({
  taskId,
  onClear,
  isRunning,
}: {
  taskId: string;
  onClear: () => void;
  isRunning: boolean;
}) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    loadTasks().then((tasks) => {
      const t = tasks.find((task) => task.id === taskId);
      setTitle(t?.title ?? "");
    });
  }, [taskId]);

  if (!title) return null;

  return (
    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5">
      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate flex-1">
        {title}
      </span>
      {!isRunning && (
        <button
          onClick={onClear}
          className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
          aria-label="Clear active task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
