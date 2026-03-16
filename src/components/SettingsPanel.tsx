"use client";

import React, { useState, useEffect } from "react";
import { Settings } from "@/lib/types";
import { TIMER_PRESETS, GOAL_PRESETS } from "@/lib/templates";
import TaskImportExport from "@/components/TaskImportExport";

interface SettingsPanelProps {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
  onTasksImported?: () => void;
}

export default function SettingsPanel({
  settings,
  onSave,
  onClose,
  onTasksImported,
}: SettingsPanelProps) {
  const [workMin, setWorkMin] = useState(
    Math.floor(settings.workDuration / 60000)
  );
  const [breakMin, setBreakMin] = useState(
    Math.floor(settings.breakDuration / 60000)
  );
  const [inactivityMin, setInactivityMin] = useState(
    Math.floor(settings.inactivityThreshold / 60000)
  );
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal);
  const [autoStart, setAutoStart] = useState(settings.autoStartEnabled);
  const [notifications, setNotifications] = useState(
    settings.notificationsEnabled
  );
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPerm(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setBrowserPerm(result);
  };
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (workMin <= 0 || breakMin <= 0 || inactivityMin <= 0 || dailyGoal <= 0) {
      return;
    }

    const newSettings: Settings = {
      workDuration: workMin * 60 * 1000,
      breakDuration: breakMin * 60 * 1000,
      inactivityThreshold: inactivityMin * 60 * 1000,
      dailyGoal,
      autoStartEnabled: autoStart,
      notificationsEnabled: notifications,
    };

    onSave(newSettings);
    setSaved(true);
    setTimeout(() => {
      onClose();
      setSaved(false);
    }, 600);
  };

  return (
    <>
      {/* Overlay */}
      <div className="settings-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="settings-panel">
        {/* Header */}
        <div
          className="px-6 py-4 text-white flex justify-between items-center rounded-t-[20px]"
          style={{
            background: "linear-gradient(135deg, #0f1b33 0%, #1a2d4a 100%)",
          }}
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            Settings
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-200 transition p-1 rounded hover:bg-white/20"
            aria-label="Close settings"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Quick Presets */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
              Quick Presets
            </h4>
            <div className="flex flex-wrap gap-2">
              {TIMER_PRESETS.map((preset) => {
                const isActive = workMin === preset.workMin && breakMin === preset.breakMin;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setWorkMin(preset.workMin);
                      setBreakMin(preset.breakMin);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      isActive
                        ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-200 ring-1 ring-blue-200 dark:ring-blue-800"
                        : "bg-slate-50 dark:bg-[#131d30] border-slate-200 dark:border-[#243350] text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
                    }`}
                    title={preset.description}
                  >
                    <span>{preset.emoji}</span>
                    <span>{preset.label}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{preset.workMin}/{preset.breakMin}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer Settings */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
              Timer Settings
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Work Duration */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-[#243350]">
                <label
                  htmlFor="workDuration"
                  className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 items-center"
                >
                  <span className="mr-1.5">⏱️</span> Work (min)
                </label>
                <input
                  type="number"
                  id="workDuration"
                  min={1}
                  max={120}
                  value={workMin}
                  onChange={(e) => setWorkMin(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-[#243350] rounded-lg text-sm bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              {/* Break Duration */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-[#243350]">
                <label
                  htmlFor="breakDuration"
                  className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 items-center"
                >
                  <span className="mr-1.5">🛏️</span> Break (min)
                </label>
                <input
                  type="number"
                  id="breakDuration"
                  min={1}
                  max={60}
                  value={breakMin}
                  onChange={(e) => setBreakMin(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-[#243350] rounded-lg text-sm bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>

              {/* Inactivity Threshold */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-[#243350]">
                <label
                  htmlFor="inactivityThreshold"
                  className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 items-center"
                >
                  <span className="mr-1.5">⏸️</span> Inactivity (min)
                </label>
                <input
                  type="number"
                  id="inactivityThreshold"
                  min={1}
                  value={inactivityMin}
                  onChange={(e) => setInactivityMin(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-[#243350] rounded-lg text-sm bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Auto-pause when inactive
                </div>
              </div>

              {/* Daily Goal */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 rounded-xl p-3 border border-slate-200 dark:border-[#243350]">
                <label
                  htmlFor="dailyGoal"
                  className="flex text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 items-center"
                >
                  <span className="mr-1.5">🎯</span> Goal (sessions)
                </label>
                <input
                  type="number"
                  id="dailyGoal"
                  min={1}
                  max={20}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-[#243350] rounded-lg text-sm bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {GOAL_PRESETS.map((gp) => (
                    <button
                      key={gp.label}
                      type="button"
                      onClick={() => setDailyGoal(gp.sessions)}
                      className={`flex-1 text-sm py-1 rounded-lg border transition-all ${
                        dailyGoal === gp.sessions
                        ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-200"
                        : "bg-white dark:bg-[#131d30] border-slate-200 dark:border-[#243350] text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
                      }`}
                      title={gp.description}
                    >
                      {gp.emoji} {gp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
              <div className="w-2 h-2 bg-slate-500 rounded-full mr-2" />
              Preferences
            </h4>
            <div className="bg-slate-50 dark:bg-[#131d30] rounded-xl p-3 border border-slate-200 dark:border-[#243350] space-y-2">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#131d30] rounded-lg border border-slate-200 dark:border-[#243350]">
                <div className="flex items-center">
                  <span className="text-base mr-2">🚀</span>
                  <label
                    htmlFor="autoStart"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Auto-start sessions
                  </label>
                </div>
                <input
                  type="checkbox"
                  id="autoStart"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-slate-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
              <span className="text-base mr-2">🔔</span>
              Notifications
            </h4>
            <div className="bg-slate-50 dark:bg-[#131d30] rounded-xl p-3 border border-slate-200 dark:border-[#243350]">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-[#131d30] rounded-lg border border-slate-200 dark:border-[#243350]">
                <div className="flex items-center">
                  <span className="text-base mr-2">💬</span>
                  <label
                    htmlFor="notifications"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Show motivational quotes
                  </label>
                </div>
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-slate-300 rounded"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-2 px-2">
                Get inspirational quotes as browser notifications after each work
                session
              </p>

              {/* Browser permission status */}
              <div className="mt-2 px-2">
                {browserPerm === "granted" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Browser notifications enabled
                  </span>
                ) : browserPerm === "denied" ? (
                  <span className="text-xs text-red-500 dark:text-red-400">
                    Notifications blocked — please enable them in your browser&apos;s site settings
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={requestPermission}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Allow browser notifications →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Import / Export */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center">
              <span className="text-base mr-2">📦</span>
              Import &amp; Export Tasks
            </h4>
            <div className="bg-slate-50 dark:bg-[#131d30] rounded-xl p-3 border border-slate-200 dark:border-[#243350]">
              <TaskImportExport onTasksImported={onTasksImported} />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center text-base"
          >
            {saved ? (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Saved!
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
