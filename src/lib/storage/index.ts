/**
 * Storage barrel — thin wrapper around the active StorageAdapter.
 *
 * Currently uses LocalStorageAdapter. To switch to Postgres (or any remote DB):
 *   1. Create a class that implements StorageAdapter (e.g. PostgresAdapter).
 *   2. Swap the adapter instantiation below.
 *   3. Existing call-sites already use the async API, so no further changes needed.
 */

export type { StorageAdapter } from "./types";
export { LocalStorageAdapter } from "./local";

import { LocalStorageAdapter } from "./local";
import type { StorageAdapter } from "./types";

// ── Active adapter (swap this line to change backend) ───
const adapter: StorageAdapter = new LocalStorageAdapter();

// ── Public API (async, delegates to adapter) ────────────
export const storage = adapter;

// ── Convenience re-exports for backward compatibility ───
// All consumers can import these directly:
export const loadSettings = () => adapter.loadSettings();
export const saveSettings = (...args: Parameters<StorageAdapter["saveSettings"]>) =>
  adapter.saveSettings(...args);

export const loadDailyGoalData = (...args: Parameters<StorageAdapter["loadDailyGoalData"]>) =>
  adapter.loadDailyGoalData(...args);
export const saveDailyGoalData = (...args: Parameters<StorageAdapter["saveDailyGoalData"]>) =>
  adapter.saveDailyGoalData(...args);

export const loadStreakHistory = () => adapter.loadStreakHistory();
export const saveStreakHistory = (...args: Parameters<StorageAdapter["saveStreakHistory"]>) =>
  adapter.saveStreakHistory(...args);
export const recordDayCompletion = (...args: Parameters<StorageAdapter["recordDayCompletion"]>) =>
  adapter.recordDayCompletion(...args);

export const loadTasks = () => adapter.loadTasks();
export const saveTasks = (...args: Parameters<StorageAdapter["saveTasks"]>) =>
  adapter.saveTasks(...args);

export const loadProjects = () => adapter.loadProjects();
export const saveProjects = (...args: Parameters<StorageAdapter["saveProjects"]>) =>
  adapter.saveProjects(...args);
export const loadSelectedProjectId = () => adapter.loadSelectedProjectId();
export const saveSelectedProjectId = (...args: Parameters<StorageAdapter["saveSelectedProjectId"]>) =>
  adapter.saveSelectedProjectId(...args);
