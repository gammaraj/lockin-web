"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTimer } from "@/hooks/useTimer";
import CircularTimer from "@/components/CircularTimer";
import TimerControls from "@/components/TimerControls";
import DailyProgress from "@/components/DailyProgress";
import SettingsPanel from "@/components/SettingsPanel";
import TaskList from "@/components/TaskList";
import Navbar from "@/components/Navbar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AmbientSounds from "@/components/AmbientSounds";
import OnboardingTour from "@/components/OnboardingTour";
import NotificationPrompt from "@/components/NotificationPrompt";
import DueDateReminders from "@/components/DueDateReminders";
import { useAuth } from "@/components/AuthProvider";
import { loadTasks } from "@/lib/storage";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function AppPage() {
  const { user, loading } = useAuth();
  const timer = useTimer({ authLoading: loading, user });
  const [showSettings, setShowSettings] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);
  const [taskListKey, setTaskListKey] = useState(0);

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
      window.dispatchEvent(new CustomEvent("tempo-session-complete", {
        detail: { taskId, elapsed },
      }));
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

  /** Complete the active task: return elapsed time, pause the timer, deselect */
  const handleCompleteTask = useCallback((taskId: string): number => {
    const elapsed = timer.getElapsedWorkTime();
    if (timer.status === "running") {
      timer.pause();
    }
    setActiveTaskId(null);
    return elapsed;
  }, [timer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-[#243350] border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1121]">
      <Navbar />
      <DueDateReminders />
      <div className="flex items-start justify-center flex-1 p-3 pt-2 sm:p-4 sm:pt-3">
      <div className="w-full max-w-[1080px] flex flex-col lg:flex-row gap-4 sm:gap-5">
        {/* Timer column */}
        <div className="w-full lg:w-[400px] lg:flex-shrink-0">
          <div className="bg-white/80 dark:bg-[#111827] backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-[#1e3050] overflow-visible relative">
            {/* Header */}
            <header
              className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-white rounded-t-2xl"
              style={{
                background: "linear-gradient(135deg, #0f1b33 0%, #1a2d4a 100%)",
              }}
            >
              <h1 className="text-base font-semibold tracking-wide">Focus Timer</h1>

              <div className="flex items-center gap-1">
              <button
                onClick={() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="lg:hidden text-xs text-white/85 hover:text-white transition px-2 py-1.5 rounded-lg hover:bg-white/10"
              >
                Tasks
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="text-white hover:text-slate-200 transition p-1.5 rounded-full hover:bg-white/10"
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
            <div className="bg-white/60 dark:bg-[#111827] backdrop-blur-sm px-4 py-1 sm:py-2">
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-[#131d30] dark:from-transparent dark:to-transparent rounded-xl p-3.5 border border-blue-100/80 dark:border-[#243350] text-center">
                  <p className="text-sm italic text-slate-600 dark:text-slate-300 leading-relaxed">
                    &ldquo;{timer.lastQuote}&rdquo;
                  </p>
                </div>
              </div>
            )}

            <DailyProgress
              dailyGoalData={timer.dailyGoalData}
              dailyGoal={timer.settings.dailyGoal}
            />

            <AmbientSounds />

            <div className="h-2" />
          </div>
        </div>

        {/* Task list column */}
        <div id="tasks-section" className="w-full lg:flex-1">
          <TaskList
            key={taskListKey}
            activeTaskId={activeTaskId}
            onSelectTask={setActiveTaskId}
            onStartTask={handleStartTask}
            onCompleteTask={handleCompleteTask}
            isTimerRunning={isRunning}
          />
        </div>

        <div className="sr-only" aria-live="polite" aria-atomic="true" />
      </div>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={timer.settings}
          onSave={timer.saveSettings}
          onClose={() => setShowSettings(false)}
          onTasksImported={() => setTaskListKey((k) => k + 1)}
        />
      )}

      <PWAInstallPrompt />
      <NotificationPrompt />
      <OnboardingTour />
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
    let cancelled = false;
    const refresh = () => {
      loadTasks().then((tasks) => {
        if (cancelled) return;
        const t = tasks.find((task) => task.id === taskId);
        setTitle(t?.title ?? "");
      });
    };
    refresh();
    // Only refresh on task-updated if the title might have changed (rename/delete)
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Skip session-complete events — they don’t change the title
      if (detail?.taskId && detail?.elapsed) return;
      refresh();
    };
    window.addEventListener("tempo-tasks-updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("tempo-tasks-updated", handleUpdate);
    };
  }, [taskId]);

  if (!title) return null;

  return (
    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/25 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2.5 border-l-[3px] border-l-blue-500 dark:border-l-blue-400">
      <div className={`w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 ${isRunning ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-medium text-blue-700 dark:text-blue-200 truncate flex-1">
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
