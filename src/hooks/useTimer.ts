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
import { getToday } from "@/lib/dates";

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
    date: getToday(),
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
  const TIMER_STATE_KEY = "foci_timer_state";

  const saveTimerState = useCallback((state: {
    endTime?: number;
    remainingTime?: number;
    status: TimerStatus;
    isBreak: boolean;
  }) => {
    try {
      const toSave = { ...state, savedDate: getToday() };
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(toSave));
    } catch {}
  }, []);

  const clearTimerState = useCallback(() => {
    try { localStorage.removeItem(TIMER_STATE_KEY); } catch {}
  }, []);

  const loadTimerState = useCallback(() => {
    try {
      const raw = localStorage.getItem(TIMER_STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Discard timer state from a previous day
      if (parsed.savedDate && parsed.savedDate !== getToday()) {
        localStorage.removeItem(TIMER_STATE_KEY);
        return null;
      }
      return parsed;
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

        // Restore timer state AFTER daily goal data is loaded so onSessionComplete
        // has the correct sessionCount (prevents resetting count to 1 on page reload)
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
                const restoredBreakMins = Math.round(loaded.breakDuration / 60000);
                setStatusText(`${restoredBreakMins} min break — you earned it!`);
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

              // Restart countdown using shared helper
              const isBreak = saved.isBreak;
              const endTime = saved.endTime;
              runCountdown(
                endTime,
                () => {
                  if (isBreak) {
                    resetToIdle();
                  } else {
                    onSessionComplete();
                  }
                },
                () => {
                  if (isBreak) {
                    resetToIdle();
                  } else {
                    setStatus("paused");
                    statusRef.current = "paused";
                    setStatusText("Paused (device slept)");
                    saveTimerState({ remainingTime: Math.max(0, endTime - Date.now()), status: "paused", isBreak: false });
                  }
                },
              );
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
      }).catch((err) => {
        console.error("[Foci] Failed to load daily goal data:", err);
      });
    }).catch((err) => {
      console.error("[Foci] Failed to load settings:", err);
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

  /** Reset UI to idle / "Ready to focus" state. */
  const resetToIdle = useCallback(() => {
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
  }, [clearTimerState]);

  /**
   * Shared countdown interval used by work timer, break timer, and resume.
   * `endTime` — timestamp when the countdown reaches zero.
   * `onComplete` — called when remaining time reaches 0.
   * `onDeviceSleep` — called when a tick gap > 60 s is detected (device slept).
   */
  const runCountdown = useCallback((
    endTime: number,
    onComplete: () => void,
    onDeviceSleep: () => void,
  ) => {
    clearTimer();
    startTimeRef.current = Date.now();
    lastTickRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const tickGap = now - lastTickRef.current;
      lastTickRef.current = now;

      if (tickGap > 60000) {
        clearTimer();
        onDeviceSleep();
        return;
      }

      const rem = Math.max(0, endTime - now);
      setRemainingTime(rem);

      if (rem <= 0) {
        onComplete();
      }
    }, 200);
  }, [clearTimer]);

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

    // If the day rolled over since the data was loaded, reset session count
    const today = getToday();
    if (dgd.date !== today) {
      dgd.sessionCount = 0;
      dgd.date = today;
    }

    dgd.sessionCount++;
    if (dgd.sessionCount === s.dailyGoal && dgd.lastStreakUpdate !== today) {
      dgd.streak = (dgd.streak || 0) + 1;
      dgd.lastStreakUpdate = today;
    }

    const goalMet = dgd.sessionCount >= s.dailyGoal;
    recordDayCompletion(new Date(), dgd.sessionCount, goalMet).catch((err) => {
      console.error("[Foci] Failed to record day completion:", err);
    });
    saveDailyGoalData(dgd).catch((err) => {
      console.error("[Foci] Failed to save daily goal data:", err);
    });
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
    const breakMins = Math.round(s.breakDuration / 60000);
    setStatusText(`${breakMins} min break — you earned it!`);
    setStatus("break");
    statusRef.current = "break";

    totalDurationRef.current = s.breakDuration;
    startTimeRef.current = Date.now();
    lastTickRef.current = Date.now();
    setRemainingTime(s.breakDuration);

    // Persist break state
    const breakEnd = Date.now() + s.breakDuration;
    saveTimerState({ endTime: breakEnd, status: "break", isBreak: true });

    // Start break countdown
    runCountdown(
      breakEnd,
      () => {
        clearTimer();
        if (settingsRef.current.autoStartEnabled) {
          resetToIdle();
          startWork();
        } else {
          resetToIdle();
        }
      },
      () => resetToIdle(), // device slept — just end the break
    );
  }, [clearTimer, showNotification, runCountdown, resetToIdle]);

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
    setRemainingTime(s.workDuration);

    // Persist so timer survives navigation
    const endTime = Date.now() + s.workDuration;
    saveTimerState({ endTime, status: "running", isBreak: false });

    runCountdown(
      endTime,
      () => onSessionComplete(),
      () => {
        setStatus("paused");
        statusRef.current = "paused";
        setStatusText("Paused (device slept)");
      },
    );
  }, [clearTimer, onSessionComplete, runCountdown, saveTimerState]);

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

      totalDurationRef.current = currentRemaining;

      // Persist resumed state
      const endTime = Date.now() + currentRemaining;
      saveTimerState({ endTime, status: "running", isBreak: false });

      runCountdown(
        endTime,
        () => onSessionComplete(),
        () => {
          setStatus("paused");
          statusRef.current = "paused";
          setStatusText("Paused (device slept)");
        },
      );
    } else if (statusRef.current !== "running" && statusRef.current !== "break") {
      startWork();
    }
  }, [startWork, onSessionComplete, remainingTime, runCountdown, saveTimerState]);

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
    resetToIdle();
    startTimeRef.current = null;
  }, [clearTimer, resetToIdle]);

  const handleSaveSettings = useCallback(
    (newSettings: Settings) => {
      setSettings(newSettings);
      settingsRef.current = newSettings;
      persistSettings(newSettings).catch((err) => {
        console.error("[Foci] Failed to save settings:", err);
      });

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

  // Reset daily data when the date changes (tab re-focus or midnight rollover)
  useEffect(() => {
    if (authLoading) return;

    const reloadIfNewDay = () => {
      const today = getToday();
      if (dailyGoalRef.current.date !== today) {
        loadDailyGoalData(settingsRef.current.dailyGoal).then((goal) => {
          setDailyGoalData(goal);
          dailyGoalRef.current = goal;
        }).catch((err) => {
          console.error("[Foci] Failed to reload daily goal data:", err);
        });
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        reloadIfNewDay();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Schedule a check at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const midnightTimer = setTimeout(() => {
      reloadIfNewDay();
    }, msUntilMidnight + 500); // small buffer to ensure we're past midnight

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimeout(midnightTimer);
    };
  }, [authLoading, user?.id]);

  // Notification permission is now requested via NotificationPrompt / SettingsPanel
  // instead of automatically on mount (which browsers may block).

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
