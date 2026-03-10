/**
 * Storage barrel — thin wrapper around the active StorageAdapter.
 *
 * Uses SupabaseStorageAdapter when the user is authenticated,
 * falls back to LocalStorageAdapter otherwise.
 */

export type { StorageAdapter } from "./types";
export { LocalStorageAdapter } from "./local";
export { SupabaseStorageAdapter } from "./supabase";

import { LocalStorageAdapter } from "./local";
import { SupabaseStorageAdapter } from "./supabase";
import type { StorageAdapter } from "./types";
import { createClient } from "../supabase/client";

// ── Adapter registry ────────────────────────────────────
const localAdapter = new LocalStorageAdapter();
let supabaseAdapter: SupabaseStorageAdapter | null = null;
let currentAdapter: StorageAdapter = localAdapter;

/**
 * Switch to the Supabase adapter (call after user logs in).
 * Migrates any existing local data to Supabase before clearing localStorage.
 */
export async function activateSupabaseStorage(): Promise<void> {
  const supabase = createClient();
  supabaseAdapter = new SupabaseStorageAdapter(supabase);
  currentAdapter = supabaseAdapter;

  // Migrate local data to Supabase if any exists
  if (typeof window !== "undefined") {
    try {
      const localTasks = localStorage.getItem("tempo_tasks");
      const localProjects = localStorage.getItem("tempo_projects");
      const localSettings = localStorage.getItem("tempo_settings");
      const localStreak = localStorage.getItem("tempo_streak_history");
      const localGoal = localStorage.getItem("tempo_daily_goal");

      // Only migrate if there's local data and Supabase has no tasks yet
      if (localTasks) {
        const existingTasks = await supabaseAdapter.loadTasks();
        if (existingTasks.length === 0) {
          const tasks = JSON.parse(localTasks);
          if (Array.isArray(tasks) && tasks.length > 0) {
            await supabaseAdapter.saveTasks(tasks);
          }
          if (localProjects) {
            const projects = JSON.parse(localProjects);
            if (Array.isArray(projects) && projects.length > 0) {
              await supabaseAdapter.saveProjects(projects);
            }
          }
          if (localSettings) {
            await supabaseAdapter.saveSettings(JSON.parse(localSettings));
          }
          if (localStreak) {
            await supabaseAdapter.saveStreakHistory(JSON.parse(localStreak));
          }
          if (localGoal) {
            await supabaseAdapter.saveDailyGoalData(JSON.parse(localGoal));
          }
        }
      }
    } catch {
      // Migration failed — continue with Supabase adapter, local data stays as fallback
    }

    // Clear local storage after successful migration
    const keys = [
      "tempo_settings",
      "tempo_daily_goal",
      "tempo_streak_history",
      "tempo_tasks",
      "tempo_projects",
      "tempo_selected_project",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  }
}

/**
 * Switch back to localStorage (call after user logs out).
 */
export function activateLocalStorage(): void {
  supabaseAdapter = null;
  currentAdapter = localAdapter;
}

/**
 * Returns the currently active adapter.
 */
export function getStorage(): StorageAdapter {
  return currentAdapter;
}

// ── Public API (async, delegates to active adapter) ─────
export const loadSettings = () => currentAdapter.loadSettings();
export const saveSettings = (...args: Parameters<StorageAdapter["saveSettings"]>) =>
  currentAdapter.saveSettings(...args);

export const loadDailyGoalData = (...args: Parameters<StorageAdapter["loadDailyGoalData"]>) =>
  currentAdapter.loadDailyGoalData(...args);
export const saveDailyGoalData = (...args: Parameters<StorageAdapter["saveDailyGoalData"]>) =>
  currentAdapter.saveDailyGoalData(...args);

export const loadStreakHistory = () => currentAdapter.loadStreakHistory();
export const saveStreakHistory = (...args: Parameters<StorageAdapter["saveStreakHistory"]>) =>
  currentAdapter.saveStreakHistory(...args);
export const recordDayCompletion = (...args: Parameters<StorageAdapter["recordDayCompletion"]>) =>
  currentAdapter.recordDayCompletion(...args);

export const loadTasks = () => currentAdapter.loadTasks();
export const saveTasks = (...args: Parameters<StorageAdapter["saveTasks"]>) =>
  currentAdapter.saveTasks(...args);
export const deleteTask = (...args: Parameters<StorageAdapter["deleteTask"]>) =>
  currentAdapter.deleteTask(...args);
export const deleteTasks = (...args: Parameters<StorageAdapter["deleteTasks"]>) =>
  currentAdapter.deleteTasks(...args);

export const loadProjects = () => currentAdapter.loadProjects();
export const saveProjects = (...args: Parameters<StorageAdapter["saveProjects"]>) =>
  currentAdapter.saveProjects(...args);
export const deleteProject = (...args: Parameters<StorageAdapter["deleteProject"]>) =>
  currentAdapter.deleteProject(...args);
export const loadSelectedProjectId = () => currentAdapter.loadSelectedProjectId();
export const saveSelectedProjectId = (...args: Parameters<StorageAdapter["saveSelectedProjectId"]>) =>
  currentAdapter.saveSelectedProjectId(...args);
