"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import {
  loadStreakHistory,
  loadTasks,
  loadProjects,
  loadSettings,
} from "@/lib/storage";
import type {
  StreakHistory,
  Task,
  Project,
  Settings,
} from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysArray(count: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(dateKey(d));
  }
  return days;
}

function shortLabel(key: string): string {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function dayLabel(key: string): string {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

// ── Chart components ─────────────────────────────────────

function BarChart({
  data,
  labelFn,
  valueSuffix = "",
  color = "#3b82f6",
  darkColor = "#60a5fa",
}: {
  data: { key: string; value: number }[];
  labelFn: (key: string) => string;
  valueSuffix?: string;
  color?: string;
  darkColor?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1 sm:gap-2 h-48 w-full">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.key} className="flex flex-col items-center flex-1 min-w-0 h-full justify-end">
            <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 truncate">
              {d.value > 0 ? `${d.value}${valueSuffix}` : ""}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%`,
                background: `var(--bar-color, ${color})`,
                minHeight: d.value > 0 ? 4 : 0,
              }}
            />
            <span className="text-[9px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
              {labelFn(d.key)}
            </span>
          </div>
        );
      })}
      <style>{`
        :root { --bar-color: ${color}; }
        .dark { --bar-color: ${darkColor}; }
      `}</style>
    </div>
  );
}

function HorizontalBar({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700 dark:text-gray-200 truncate mr-2">
              {item.label}
            </span>
            <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatMs(item.value)}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-[#1a2744] rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color,
                minWidth: item.value > 0 ? 8 : 0,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-[#1e3355] shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ── PROJECT COLORS ───────────────────────────────────────
const PROJECT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
];

// ══════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();

  const [streakHistory, setStreakHistory] = useState<StreakHistory>({ days: {} });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [range, setRange] = useState<7 | 30>(7);
  const [loaded, setLoaded] = useState(false);

  // Load data
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const [sh, t, p, s] = await Promise.all([
        loadStreakHistory(),
        loadTasks(),
        loadProjects(),
        loadSettings(),
      ]);
      setStreakHistory(sh);
      setTasks(t);
      setProjects(p);
      setSettings(s);
      setLoaded(true);
    })();
  }, [authLoading, user]);

  // ── Derived data ────────────────────────────────────────

  const days = getDaysArray(range);
  const workDuration = settings?.workDuration ?? 30 * 60 * 1000;

  // Sessions per day
  const sessionsData = days.map((key) => ({
    key,
    value: streakHistory.days[key]?.sessionCount ?? 0,
  }));

  // Focus time per day (sessions × workDuration)
  const focusData = days.map((key) => ({
    key,
    value: Math.round(((streakHistory.days[key]?.sessionCount ?? 0) * workDuration) / 60_000), // minutes
  }));

  // Total stats
  const allDayKeys = Object.keys(streakHistory.days);
  const totalSessions = allDayKeys.reduce((s, k) => s + (streakHistory.days[k]?.sessionCount ?? 0), 0);
  const totalFocusMs = totalSessions * workDuration;
  const activeDays = allDayKeys.filter((k) => (streakHistory.days[k]?.sessionCount ?? 0) > 0).length;
  const avgSessionsPerDay = activeDays > 0 ? (totalSessions / activeDays).toFixed(1) : "0";

  // Current streak
  let currentStreak = 0;
  {
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dateKey(d);
      if (streakHistory.days[k]?.goalMet) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
      // If today has no data yet, keep checking yesterday
    }
  }

  // Longest streak
  let longestStreak = 0;
  {
    const sorted = allDayKeys.sort();
    let run = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (streakHistory.days[sorted[i]]?.goalMet) {
        run++;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 0;
      }
    }
  }

  // Focus by project
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const projectFocus: Record<string, number> = {};
  for (const t of tasks) {
    const name = projectMap.get(t.projectId) ?? "General";
    projectFocus[name] = (projectFocus[name] ?? 0) + (t.timeSpent ?? 0);
  }
  const projectItems = Object.entries(projectFocus)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], i) => ({
      label,
      value,
      color: PROJECT_COLORS[i % PROJECT_COLORS.length],
    }));

  // Goal completion rate
  const goalDays = allDayKeys.filter((k) => streakHistory.days[k]?.goalMet).length;
  const goalRate = activeDays > 0 ? Math.round((goalDays / activeDays) * 100) : 0;

  // ── Render ──────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-[#0a1628] dark:to-[#0f1b33]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500 dark:text-gray-400">
          Loading stats…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-[#0a1628] dark:to-[#0f1b33]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
          Stats &amp; Analytics
        </h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard
            label="Total Sessions"
            value={String(totalSessions)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label="Focus Time"
            value={formatMs(totalFocusMs)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Current Streak"
            value={`${currentStreak}d`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            }
          />
          <StatCard
            label="Avg / Active Day"
            value={avgSessionsPerDay}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Range toggle */}
        <div className="flex gap-2 mb-6">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                range === r
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-[#0f1b33] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#1e3355] hover:bg-gray-50 dark:hover:bg-[#162a4a]"
              }`}
            >
              {r === 7 ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Sessions per day */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sessions per Day
            </h2>
            <BarChart
              data={sessionsData}
              labelFn={range === 7 ? dayLabel : (k) => k.slice(8)}
              color="#3b82f6"
              darkColor="#60a5fa"
            />
          </div>

          {/* Focus time per day */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Focus Time per Day
            </h2>
            <BarChart
              data={focusData}
              labelFn={range === 7 ? dayLabel : (k) => k.slice(8)}
              valueSuffix="m"
              color="#10b981"
              darkColor="#34d399"
            />
          </div>

          {/* Focus by project */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Focus by Project
            </h2>
            {projectItems.length > 0 ? (
              <HorizontalBar items={projectItems} />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No focus time recorded yet.
              </p>
            )}
          </div>

          {/* Goal completion & extras */}
          <div className="bg-white dark:bg-[#0f1b33] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1e3355] shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Overview
            </h2>
            <div className="space-y-4">
              {/* Goal completion rate */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-200 font-medium">
                    Goal Completion Rate
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{goalRate}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#1a2744] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${goalRate}%` }}
                  />
                </div>
              </div>

              {/* Additional stats */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{longestStreak}d</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Longest Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeDays}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Days</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{goalDays}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Goals Met</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
