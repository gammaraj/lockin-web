import {
  Settings,
  DailyGoalData,
  StreakHistory,
  Task,
  Project,
} from "../types";

/**
 * StorageAdapter defines the contract for all persistence operations.
 * Implement this interface to swap the storage backend
 * (e.g. localStorage → PostgreSQL, Supabase, etc.).
 *
 * All methods are async to support remote databases out of the box.
 */
export interface StorageAdapter {
  // ── Settings ──────────────────────────────────────────
  loadSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;

  // ── Daily Goal ────────────────────────────────────────
  loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData>;
  saveDailyGoalData(data: DailyGoalData): Promise<void>;

  // ── Streak History ────────────────────────────────────
  loadStreakHistory(): Promise<StreakHistory>;
  saveStreakHistory(history: StreakHistory): Promise<void>;
  recordDayCompletion(
    date: Date,
    sessionCount: number,
    goalMet: boolean,
  ): Promise<void>;

  // ── Tasks ─────────────────────────────────────────────
  loadTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  deleteTask(id: string): Promise<void>;
  deleteTasks(ids: string[]): Promise<void>;

  // ── Projects ──────────────────────────────────────────
  loadProjects(): Promise<Project[]>;
  saveProjects(projects: Project[]): Promise<void>;
  deleteProject(id: string): Promise<void>;
  loadSelectedProjectId(): Promise<string>;
  saveSelectedProjectId(id: string): Promise<void>;
}
