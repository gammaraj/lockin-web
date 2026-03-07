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
 */
export function activateSupabaseStorage(): void {
  const supabase = createClient();
  supabaseAdapter = new SupabaseStorageAdapter(supabase);
  currentAdapter = supabaseAdapter;
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

export const loadProjects = () => currentAdapter.loadProjects();
export const saveProjects = (...args: Parameters<StorageAdapter["saveProjects"]>) =>
  currentAdapter.saveProjects(...args);
export const loadSelectedProjectId = () => currentAdapter.loadSelectedProjectId();
export const saveSelectedProjectId = (...args: Parameters<StorageAdapter["saveSelectedProjectId"]>) =>
  currentAdapter.saveSelectedProjectId(...args);
