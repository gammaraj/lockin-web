"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  DailyGoalData,
  TimerStatus,
  DEFAULT_SETTINGS,
} from "@/lib/types";
import {
  loadSettings,
  saveSettings as persistSettings,
  loadDailyGoalData,
  saveDailyGoalData,
  recordDayCompletion,
} from "@/lib/storage";
import { getRandomQuote } from "@/lib/quotes";

export interface TimerState {
  // Timer
  remainingTime: number;
  totalDuration: number;
  status: TimerStatus;
  isBreakMode: boolean;
  label: string;
  statusText: string;

  // Daily progress
  dailyGoalData: DailyGoalData;
  settings: Settings;

  // Last quote
  lastQuote: string | null;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  saveSettings: (s: Settings) => void;
  setOnSessionCompleteCallback: (cb: (() => void) | null) => void;
  getElapsedWorkTime: () => number;
}

export function useTimer(): TimerState {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [dailyGoalData, setDailyGoalData] = useState<DailyGoalData>({
    date: new Date().toDateString(),
    sessionCount: 0,
    streak: 0,
    lastStreakUpdate: null,
  });

  const [remainingTime, setRemainingTime] = useState(DEFAULT_SETTINGS.workDuration);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [isBreakMode, setIsBreakMode] = useState(false);
  const [label, setLabel] = useState("Focus Time");
  const [statusText, setStatusText] = useState("Ready to focus");
  const [lastQuote, setLastQuote] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const totalDurationRef = useRef(DEFAULT_SETTINGS.workDuration);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const dailyGoalRef = useRef<DailyGoalData>(dailyGoalData);
  const isBreakModeRef = useRef(false);
  const statusRef = useRef<TimerStatus>("idle");
  const onSessionCompleteCbRef = useRef<(() => void) | null>(null);

  // Load persisted data on mount
  useEffect(() => {
    loadSettings().then((loaded) => {
      setSettings(loaded);
      settingsRef.current = loaded;
      totalDurationRef.current = loaded.workDuration;
      setRemainingTime(loaded.workDuration);

      loadDailyGoalData(loaded.dailyGoal).then((goal) => {
        setDailyGoalData(goal);
        dailyGoalRef.current = goal;
      });
    });
  }, []);

  // Sync refs
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    dailyGoalRef.current = dailyGoalData;
  }, [dailyGoalData]);

  useEffect(() => {
    isBreakModeRef.current = isBreakMode;
  }, [isBreakMode]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback(
    (quote: string, goalMet: boolean, sessionCount: number, dailyGoal: number) => {
      if (!settingsRef.current.notificationsEnabled) return;
      if (typeof window === "undefined" || !("Notification" in window)) return;

      const title = goalMet
        ? "Daily Goal Achieved!"
        : "Work Session Complete!";
      const body = goalMet
        ? `Congratulations! You've completed ${sessionCount}/${dailyGoal} sessions today!\n\n"${quote}"`
        : `Session ${sessionCount} complete! Keep going to reach your goal of ${dailyGoal}!\n\n"${quote}"`;

      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon.png" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification(title, { body, icon: "/icon.png" });
          }
        });
      }
    },
    []
  );

  // Session completion handler
  const onSessionComplete = useCallback(() => {
    clearTimer();

    const s = settingsRef.current;
    const dgd = { ...dailyGoalRef.current };
    dgd.sessionCount++;

    // Update streak
    const today = new Date().toDateString();
    if (dgd.sessionCount === s.dailyGoal && dgd.lastStreakUpdate !== today) {
      dgd.streak = (dgd.streak || 0) + 1;
      dgd.lastStreakUpdate = today;
    }

    const goalMet = dgd.sessionCount >= s.dailyGoal;
    recordDayCompletion(new Date(), dgd.sessionCount, goalMet);
    saveDailyGoalData(dgd);
    setDailyGoalData({ ...dgd });
    dailyGoalRef.current = dgd;

    // Show quote
    const quote = getRandomQuote();
    setLastQuote(quote);
    showNotification(quote, goalMet, dgd.sessionCount, s.dailyGoal);

    // Notify external callback (e.g. task list)
    if (onSessionCompleteCbRef.current) {
      onSessionCompleteCbRef.current();
    }

    // Enter break mode
    setIsBreakMode(true);
    isBreakModeRef.current = true;
    setLabel("Great work!");
    setStatusText("Take a well-deserved break");
    setStatus("break");
    statusRef.current = "break";

    totalDurationRef.current = s.breakDuration;
    startTimeRef.current = Date.now();
    setRemainingTime(s.breakDuration);

    // Start break countdown
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const rem = Math.max(0, settingsRef.current.breakDuration - elapsed);
      setRemainingTime(rem);

      if (rem <= 0) {
        clearTimer();
        setIsBreakMode(false);
        isBreakModeRef.current = false;
        setLastQuote(null);

        if (settingsRef.current.autoStartEnabled) {
          // Auto-start next work session
          startWork();
        } else {
          setStatus("idle");
          statusRef.current = "idle";
          setLabel("Focus Time");
          setStatusText("Ready to focus");
          totalDurationRef.current = settingsRef.current.workDuration;
          setRemainingTime(settingsRef.current.workDuration);
        }
      }
    }, 200);
  }, [clearTimer, showNotification]);

  // Start work timer
  const startWork = useCallback(() => {
    clearTimer();
    const s = settingsRef.current;

    setIsBreakMode(false);
    isBreakModeRef.current = false;
    setStatus("running");
    statusRef.current = "running";
    setLabel("Focus Time");
    setStatusText("Stay focused! 💪");
    setLastQuote(null);

    totalDurationRef.current = s.workDuration;
    startTimeRef.current = Date.now();
    setRemainingTime(s.workDuration);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (startTimeRef.current || now);
      const rem = Math.max(0, settingsRef.current.workDuration - elapsed);
      setRemainingTime(rem);

      if (rem <= 0) {
        onSessionComplete();
      }
    }, 200);
  }, [clearTimer, onSessionComplete]);

  const start = useCallback(() => {
    if (statusRef.current === "paused") {
      // Resume from pause
      const s = settingsRef.current;
      const currentRemaining =
        statusRef.current === "paused"
          ? remainingTime
          : s.workDuration;

      setStatus("running");
      statusRef.current = "running";
      setStatusText("Welcome back! 🎯");

      const resumeStart = Date.now();
      startTimeRef.current = resumeStart;
      totalDurationRef.current = currentRemaining;

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - resumeStart;
        const rem = Math.max(0, currentRemaining - elapsed);
        setRemainingTime(rem);

        if (rem <= 0) {
          onSessionComplete();
        }
      }, 200);
    } else if (statusRef.current !== "running" && statusRef.current !== "break") {
      startWork();
    }
  }, [startWork, onSessionComplete, remainingTime]);

  const pause = useCallback(() => {
    if (statusRef.current === "running") {
      clearTimer();
      setStatus("paused");
      statusRef.current = "paused";
      setStatusText("Paused");
    }
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsBreakMode(false);
    isBreakModeRef.current = false;
    setStatus("idle");
    statusRef.current = "idle";
    setLabel("Focus Time");
    setStatusText("Ready to focus");
    setLastQuote(null);
    totalDurationRef.current = settingsRef.current.workDuration;
    setRemainingTime(settingsRef.current.workDuration);
    startTimeRef.current = null;
  }, [clearTimer]);

  const handleSaveSettings = useCallback(
    (newSettings: Settings) => {
      setSettings(newSettings);
      settingsRef.current = newSettings;
      persistSettings(newSettings);

      // If idle, update the displayed timer
      if (statusRef.current === "idle") {
        totalDurationRef.current = newSettings.workDuration;
        setRemainingTime(newSettings.workDuration);
      }
    },
    []
  );

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Request notification permission on mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  const setOnSessionCompleteCallback = useCallback(
    (cb: (() => void) | null) => {
      onSessionCompleteCbRef.current = cb;
    },
    []
  );

  /** Returns ms of work time elapsed in the current session (0 during break/idle). */
  const getElapsedWorkTime = useCallback(() => {
    if (isBreakModeRef.current) return 0;
    const s = statusRef.current;
    if (s === "running" && startTimeRef.current) {
      return Date.now() - startTimeRef.current;
    }
    if (s === "paused") {
      // totalDurationRef holds the remaining time at pause start
      return settingsRef.current.workDuration - remainingTime;
    }
    return 0;
  }, [remainingTime]);

  return {
    remainingTime,
    totalDuration: totalDurationRef.current,
    status,
    isBreakMode,
    label,
    statusText,
    dailyGoalData,
    settings,
    lastQuote,
    start,
    pause,
    reset,
    saveSettings: handleSaveSettings,
    setOnSessionCompleteCallback,
    getElapsedWorkTime,
  };
}
