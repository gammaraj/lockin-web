import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECT,
} from "./types";

const SETTINGS_KEY = "lockin_settings";
const DAILY_GOAL_KEY = "lockin_daily_goal";
const STREAK_HISTORY_KEY = "lockin_streak_history";
const TASKS_KEY = "lockin_tasks";
const PROJECTS_KEY = "lockin_projects";
const SELECTED_PROJECT_KEY = "lockin_selected_project";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ===== Settings =====

export function loadSettings(): Settings {
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

export function saveSettings(settings: Settings): void {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ===== Daily Goal Data =====

function getToday(): string {
  return new Date().toDateString();
}

function getYesterday(): string {
  return new Date(Date.now() - 86400000).toDateString();
}

export function loadDailyGoalData(dailyGoal: number): DailyGoalData {
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

    // Same day — keep existing
    if (saved.date === today) {
      return saved;
    }

    // Yesterday — keep streak only if goal was met
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

    // More than one day passed — reset
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

export function saveDailyGoalData(data: DailyGoalData): void {
  if (!isBrowser()) return;
  localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(data));
}

// ===== Streak History =====

export function loadStreakHistory(): StreakHistory {
  if (!isBrowser()) return { days: {} };
  try {
    const raw = localStorage.getItem(STREAK_HISTORY_KEY);
    if (!raw) return { days: {} };
    return JSON.parse(raw);
  } catch {
    return { days: {} };
  }
}

export function saveStreakHistory(history: StreakHistory): void {
  if (!isBrowser()) return;
  localStorage.setItem(STREAK_HISTORY_KEY, JSON.stringify(history));
}

export function recordDayCompletion(
  date: Date,
  sessionCount: number,
  goalMet: boolean
): void {
  const history = loadStreakHistory();
  const dateKey = date.toISOString().split("T")[0];
  history.days[dateKey] = {
    sessionCount,
    goalMet,
    timestamp: Date.now(),
  };
  saveStreakHistory(history);
}

// ===== Tasks =====

export function loadTasks(): Task[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// ===== Projects =====

export function loadProjects(): Project[] {
  if (!isBrowser()) return [DEFAULT_PROJECT];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [DEFAULT_PROJECT];
    const projects: Project[] = JSON.parse(raw);
    // Ensure default project always exists
    if (!projects.find((p) => p.id === DEFAULT_PROJECT.id)) {
      return [DEFAULT_PROJECT, ...projects];
    }
    return projects;
  } catch {
    return [DEFAULT_PROJECT];
  }
}

export function saveProjects(projects: Project[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadSelectedProjectId(): string {
  if (!isBrowser()) return DEFAULT_PROJECT.id;
  return localStorage.getItem(SELECTED_PROJECT_KEY) || DEFAULT_PROJECT.id;
}

export function saveSelectedProjectId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(SELECTED_PROJECT_KEY, id);
}
