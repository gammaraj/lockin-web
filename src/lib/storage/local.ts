import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECT,
} from "../types";
import type { StorageAdapter } from "./types";

const SETTINGS_KEY = "lockin_settings";
const DAILY_GOAL_KEY = "lockin_daily_goal";
const STREAK_HISTORY_KEY = "lockin_streak_history";
const TASKS_KEY = "lockin_tasks";
const PROJECTS_KEY = "lockin_projects";
const SELECTED_PROJECT_KEY = "lockin_selected_project";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getToday(): string {
  return new Date().toDateString();
}

function getYesterday(): string {
  return new Date(Date.now() - 86400000).toDateString();
}

/**
 * localStorage-backed implementation of StorageAdapter.
 * Methods are async to satisfy the interface, but resolve synchronously.
 */
export class LocalStorageAdapter implements StorageAdapter {
  // ── Settings ──────────────────────────────────────────

  async loadSettings(): Promise<Settings> {
    if (!isBrowser()) return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    if (!isBrowser()) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // ── Daily Goal ────────────────────────────────────────

  async loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData> {
    if (!isBrowser()) {
      return {
        date: getToday(),
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
    }

    try {
      const raw = localStorage.getItem(DAILY_GOAL_KEY);
      if (!raw) {
        const initial: DailyGoalData = {
          date: getToday(),
          sessionCount: 0,
          streak: 0,
          lastStreakUpdate: null,
        };
        localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(initial));
        return initial;
      }

      const saved: DailyGoalData = JSON.parse(raw);
      const today = getToday();
      const yesterday = getYesterday();

      if (saved.date === today) {
        return saved;
      }

      if (saved.date === yesterday) {
        const wasGoalMet = saved.sessionCount >= dailyGoal;
        const newData: DailyGoalData = {
          date: today,
          sessionCount: 0,
          streak: wasGoalMet ? saved.streak : 0,
          lastStreakUpdate: null,
        };
        localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(newData));
        return newData;
      }

      const newData: DailyGoalData = {
        date: today,
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
      localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(newData));
      return newData;
    } catch {
      return {
        date: getToday(),
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
    }
  }

  async saveDailyGoalData(data: DailyGoalData): Promise<void> {
    if (!isBrowser()) return;
    localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(data));
  }

  // ── Streak History ────────────────────────────────────

  async loadStreakHistory(): Promise<StreakHistory> {
    if (!isBrowser()) return { days: {} };
    try {
      const raw = localStorage.getItem(STREAK_HISTORY_KEY);
      if (!raw) return { days: {} };
      return JSON.parse(raw);
    } catch {
      return { days: {} };
    }
  }

  async saveStreakHistory(history: StreakHistory): Promise<void> {
    if (!isBrowser()) return;
    localStorage.setItem(STREAK_HISTORY_KEY, JSON.stringify(history));
  }

  async recordDayCompletion(
    date: Date,
    sessionCount: number,
    goalMet: boolean,
  ): Promise<void> {
    const history = await this.loadStreakHistory();
    const dateKey = date.toISOString().split("T")[0];
    history.days[dateKey] = {
      sessionCount,
      goalMet,
      timestamp: Date.now(),
    };
    await this.saveStreakHistory(history);
  }

  // ── Tasks ─────────────────────────────────────────────

  async loadTasks(): Promise<Task[]> {
    if (!isBrowser()) return [];
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    if (!isBrowser()) return;
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  // ── Projects ──────────────────────────────────────────

  async loadProjects(): Promise<Project[]> {
    if (!isBrowser()) return [DEFAULT_PROJECT];
    try {
      const raw = localStorage.getItem(PROJECTS_KEY);
      if (!raw) return [DEFAULT_PROJECT];
      const projects: Project[] = JSON.parse(raw);
      if (!projects.find((p) => p.id === DEFAULT_PROJECT.id)) {
        return [DEFAULT_PROJECT, ...projects];
      }
      return projects;
    } catch {
      return [DEFAULT_PROJECT];
    }
  }

  async saveProjects(projects: Project[]): Promise<void> {
    if (!isBrowser()) return;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }

  async loadSelectedProjectId(): Promise<string> {
    if (!isBrowser()) return DEFAULT_PROJECT.id;
    return localStorage.getItem(SELECTED_PROJECT_KEY) || DEFAULT_PROJECT.id;
  }

  async saveSelectedProjectId(id: string): Promise<void> {
    if (!isBrowser()) return;
    localStorage.setItem(SELECTED_PROJECT_KEY, id);
  }
}
