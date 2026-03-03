// ===== Types =====

export interface Settings {
  workDuration: number; // in milliseconds
  breakDuration: number; // in milliseconds (was resetThreshold)
  inactivityThreshold: number; // in milliseconds
  dailyGoal: number;
  autoStartEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface DailyGoalData {
  date: string;
  sessionCount: number;
  streak: number;
  lastStreakUpdate: string | null;
}

export interface DayHistory {
  sessionCount: number;
  goalMet: boolean;
  timestamp: number;
}

export interface StreakHistory {
  days: Record<string, DayHistory>;
}

export type TimerMode = "work" | "break" | "idle";

export type TimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "break"
  | "completed";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export const DEFAULT_PROJECT_ID = "__general__";

export const DEFAULT_PROJECT: Project = {
  id: DEFAULT_PROJECT_ID,
  name: "General",
  createdAt: 0,
};

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  sessions: number; // number of sessions spent on this task
  timeSpent: number; // total milliseconds spent on this task
  createdAt: number;
  projectId: string; // which project this task belongs to
  subtasks?: Subtask[];
}

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 30 * 60 * 1000, // 30 minutes
  breakDuration: 5 * 60 * 1000, // 5 minutes
  inactivityThreshold: 1 * 60 * 1000, // 1 minute
  dailyGoal: 3,
  autoStartEnabled: true,
  notificationsEnabled: true,
};
