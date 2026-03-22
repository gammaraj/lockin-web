"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Task } from "@/lib/types";
import { loadTasks } from "@/lib/storage";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Reminder {
  id: string;
  taskTitle: string;
  type: "overdue" | "today" | "tomorrow";
}

const CHECK_INTERVAL = 60 * 60 * 1000; // re-check every hour

export default function DueDateReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const lastCheckDateRef = useRef<string>("");

  const checkDueDates = useCallback(async () => {
    const today = todayStr();

    // Only send browser notifications once per day
    const shouldNotify = lastCheckDateRef.current !== today;
    lastCheckDateRef.current = today;

    const tomorrow = tomorrowStr();
    let tasks: Task[];
    try {
      tasks = await loadTasks();
    } catch {
      return;
    }

    const pending = tasks.filter((t) => t.dueDate && !t.completed && !t.archivedAt);

    const newReminders: Reminder[] = [];
    const notificationLines: string[] = [];

    for (const task of pending) {
      const due = task.dueDate!;
      let type: Reminder["type"] | null = null;

      if (due < today) type = "overdue";
      else if (due === today) type = "today";
      else if (due === tomorrow) type = "tomorrow";

      if (type) {
        newReminders.push({ id: task.id, taskTitle: task.title, type });
        if (shouldNotify) {
          const label =
            type === "overdue" ? "Overdue" : type === "today" ? "Due today" : "Due tomorrow";
          notificationLines.push(`• ${label}: ${task.title}`);
        }
      }
    }

    setReminders(newReminders);

    // Browser notification (once per day)
    if (shouldNotify && notificationLines.length > 0) {
      sendBrowserNotification(notificationLines);
    }
  }, []);

  useEffect(() => {
    checkDueDates();
    const interval = setInterval(checkDueDates, CHECK_INTERVAL);

    // Also re-check when tasks change
    const handleUpdate = () => checkDueDates();
    window.addEventListener("tempo-tasks-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("tempo-tasks-updated", handleUpdate);
    };
  }, [checkDueDates]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const dismissAll = () => {
    setDismissed(new Set(reminders.map((r) => r.id)));
  };

  const visible = reminders.filter((r) => !dismissed.has(r.id));

  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {/* Dismiss all button for 3+ reminders */}
      {visible.length >= 3 && (
        <button
          onClick={dismissAll}
          className="self-end text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1a2d4a]"
        >
          Dismiss all
        </button>
      )}
      {visible.slice(0, 5).map((r) => (
        <div
          key={r.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-5 ${
            r.type === "overdue"
              ? "bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-800"
              : r.type === "today"
                ? "bg-orange-50/95 dark:bg-orange-950/90 border-orange-200 dark:border-orange-800"
                : "bg-blue-50/95 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800"
          }`}
        >
          <span className="text-base mt-0.5">
            {r.type === "overdue" ? "🔴" : r.type === "today" ? "🟠" : "🔵"}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wide ${
              r.type === "overdue"
                ? "text-red-600 dark:text-red-400"
                : r.type === "today"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-blue-600 dark:text-blue-400"
            }`}>
              {r.type === "overdue" ? "Overdue" : r.type === "today" ? "Due Today" : "Due Tomorrow"}
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {r.taskTitle}
            </p>
          </div>
          <button
            onClick={() => dismiss(r.id)}
            className="flex-shrink-0 p-2 -m-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function sendBrowserNotification(lines: string[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const body = lines.join("\n");
  const title = "Foci — Task Reminders";
  const options = {
    body,
    icon: "/icon.png",
    tag: "foci-due-date-reminder",
  };

  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, options);
    }).catch(() => {
      new Notification(title, options);
    });
  } else {
    new Notification(title, options);
  }
}
