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

export interface TimerOptions {
  /** Pass auth state so the hook waits for the correct storage adapter before loading data. */
  authLoading?: boolean;
  user?: { id: string } | null;
}

export function useTimer({ authLoading = false, user }: TimerOptions = {}): TimerState {
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
  const lastTickRef = useRef<number>(Date.now());
  const totalDurationRef = useRef(DEFAULT_SETTINGS.workDuration);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const dailyGoalRef = useRef<DailyGoalData>(dailyGoalData);
  const isBreakModeRef = useRef(false);
  const statusRef = useRef<TimerStatus>("idle");
  const onSessionCompleteCbRef = useRef<(() => void) | null>(null);

  // ── Timer state persistence across navigation ──
  const TIMER_STATE_KEY = "tempo_timer_state";

  const saveTimerState = useCallback((state: {
    endTime?: number;
    remainingTime?: number;
    status: TimerStatus;
    isBreak: boolean;
  }) => {
    try { localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state)); } catch {}
  }, []);

  const clearTimerState = useCallback(() => {
    try { localStorage.removeItem(TIMER_STATE_KEY); } catch {}
  }, []);

  const loadTimerState = useCallback(() => {
    try {
      const raw = localStorage.getItem(TIMER_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  // Load persisted data — wait for auth to resolve so the correct adapter (Supabase vs localStorage) is active
  useEffect(() => {
    if (authLoading) return;

    loadSettings().then((loaded) => {
      setSettings(loaded);
      settingsRef.current = loaded;
      totalDurationRef.current = loaded.workDuration;
      setRemainingTime(loaded.workDuration);

      loadDailyGoalData(loaded.dailyGoal).then((goal) => {
        setDailyGoalData(goal);
        dailyGoalRef.current = goal;
      });

      // Restore timer state if navigated away and came back
      const saved = loadTimerState();
      if (saved) {
        if (saved.status === "paused" && saved.remainingTime > 0) {
          setRemainingTime(saved.remainingTime);
          totalDurationRef.current = saved.remainingTime;
          setStatus("paused");
          statusRef.current = "paused";
          setStatusText("Paused");
          setLabel("Focus Time");
        } else if ((saved.status === "running" || saved.status === "break") && saved.endTime) {
          const rem = saved.endTime - Date.now();
          if (rem > 0) {
            // Timer is still active — restore and resume
            if (saved.isBreak) {
              setIsBreakMode(true);
              isBreakModeRef.current = true;
              setLabel("Great work!");
              setStatusText("Take a well-deserved break");
              setStatus("break");
              statusRef.current = "break";
              totalDurationRef.current = loaded.breakDuration;
            } else {
              setStatus("running");
              statusRef.current = "running";
              setLabel("Focus Time");
              setStatusText("Stay focused! 💪");
              totalDurationRef.current = loaded.workDuration;
            }
            setRemainingTime(rem);
            startTimeRef.current = Date.now();
            lastTickRef.current = Date.now();

            // Restart interval — delegate to start/startWork would cause circular refs,
            // so inline a simple countdown here
            const isBreak = saved.isBreak;
            const endTime = saved.endTime;
            timerRef.current = setInterval(() => {
              const now = Date.now();
              const tickGap = now - lastTickRef.current;
              lastTickRef.current = now;

              if (tickGap > 3000) {
                clearTimer();
                if (isBreak) {
                  clearTimerState();
                  setIsBreakMode(false);
                  isBreakModeRef.current = false;
                  setLastQuote(null);
                  setStatus("idle");
                  statusRef.current = "idle";
                  setLabel("Focus Time");
                  setStatusText("Ready to focus");
                  totalDurationRef.current = settingsRef.current.workDuration;
                  setRemainingTime(settingsRef.current.workDuration);
                } else {
                  setStatus("paused");
                  statusRef.current = "paused";
                  setStatusText("Paused (device slept)");
                  saveTimerState({ remainingTime: Math.max(0, endTime - now), status: "paused", isBreak: false });
                }
                return;
              }

              const r = Math.max(0, endTime - now);
              setRemainingTime(r);

              if (r <= 0) {
                if (isBreak) {
                  clearTimer();
                  clearTimerState();
                  setIsBreakMode(false);
                  isBreakModeRef.current = false;
                  setLastQuote(null);
                  setStatus("idle");
                  statusRef.current = "idle";
                  setLabel("Focus Time");
                  setStatusText("Ready to focus");
                  totalDurationRef.current = settingsRef.current.workDuration;
                  setRemainingTime(settingsRef.current.workDuration);
                } else {
                  onSessionComplete();
                }
              }
            }, 200);
          } else {
            // Timer expired while away
            clearTimerState();
            if (!saved.isBreak) {
              // Work session completed while navigated away — trigger completion
              onSessionComplete();
            }
          }
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

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
    lastTickRef.current = Date.now();
    setRemainingTime(s.breakDuration);

    // Persist break state
    saveTimerState({ endTime: Date.now() + s.breakDuration, status: "break", isBreak: true });

    // Start break countdown
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const tickGap = now - lastTickRef.current;
      lastTickRef.current = now;

      // Skip break timer if device slept — just end the break
      if (tickGap > 3000) {
        clearTimer();
        clearTimerState();
        setIsBreakMode(false);
        isBreakModeRef.current = false;
        setLastQuote(null);
        setStatus("idle");
        statusRef.current = "idle";
        setLabel("Focus Time");
        setStatusText("Ready to focus");
        totalDurationRef.current = settingsRef.current.workDuration;
        setRemainingTime(settingsRef.current.workDuration);
        return;
      }

      const elapsed = now - (startTimeRef.current || now);
      const rem = Math.max(0, settingsRef.current.breakDuration - elapsed);
      setRemainingTime(rem);

      if (rem <= 0) {
        clearTimer();
        clearTimerState();
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
    lastTickRef.current = Date.now();
    setRemainingTime(s.workDuration);

    // Persist so timer survives navigation
    saveTimerState({ endTime: Date.now() + s.workDuration, status: "running", isBreak: false });

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const tickGap = now - lastTickRef.current;
      lastTickRef.current = now;

      // If gap between ticks > 3s, device likely slept — pause to avoid false completion
      if (tickGap > 3000) {
        clearTimer();
        setStatus("paused");
        statusRef.current = "paused";
        setStatusText("Paused (device slept)");
        return;
      }

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
      lastTickRef.current = Date.now();
      totalDurationRef.current = currentRemaining;

      // Persist resumed state
      saveTimerState({ endTime: Date.now() + currentRemaining, status: "running", isBreak: false });

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const tickGap = now - lastTickRef.current;
        lastTickRef.current = now;

        if (tickGap > 3000) {
          clearTimer();
          setStatus("paused");
          statusRef.current = "paused";
          setStatusText("Paused (device slept)");
          return;
        }

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
      saveTimerState({ remainingTime, status: "paused", isBreak: false });
    }
  }, [clearTimer, remainingTime, saveTimerState]);

  const reset = useCallback(() => {
    clearTimer();
    clearTimerState();
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
