import type { SupabaseClient } from "@supabase/supabase-js";
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

function getToday(): string {
  return new Date().toDateString();
}

function getYesterday(): string {
  return new Date(Date.now() - 86400000).toDateString();
}

/**
 * Supabase-backed implementation of StorageAdapter.
 * Requires an authenticated Supabase client (user session must be active).
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  constructor(private supabase: SupabaseClient) {}

  private async getUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    return user.id;
  }

  // ── Settings ──────────────────────────────────────────

  async loadSettings(): Promise<Settings> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) return DEFAULT_SETTINGS;

    return {
      workDuration: data.work_duration,
      breakDuration: data.break_duration,
      inactivityThreshold: data.inactivity_threshold,
      dailyGoal: data.daily_goal,
      autoStartEnabled: data.auto_start_enabled,
      notificationsEnabled: data.notifications_enabled,
    };
  }

  async saveSettings(settings: Settings): Promise<void> {
    const userId = await this.getUserId();
    await this.supabase.from("settings").upsert({
      user_id: userId,
      work_duration: settings.workDuration,
      break_duration: settings.breakDuration,
      inactivity_threshold: settings.inactivityThreshold,
      daily_goal: settings.dailyGoal,
      auto_start_enabled: settings.autoStartEnabled,
      notifications_enabled: settings.notificationsEnabled,
      updated_at: new Date().toISOString(),
    });
  }

  // ── Daily Goal ────────────────────────────────────────

  async loadDailyGoalData(dailyGoal: number): Promise<DailyGoalData> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("daily_goal_data")
      .select("*")
      .eq("user_id", userId)
      .single();

    const today = getToday();

    if (!data) {
      const initial: DailyGoalData = {
        date: today,
        sessionCount: 0,
        streak: 0,
        lastStreakUpdate: null,
      };
      await this.saveDailyGoalData(initial);
      return initial;
    }

    const saved: DailyGoalData = {
      date: data.date,
      sessionCount: data.session_count,
      streak: data.streak,
      lastStreakUpdate: data.last_streak_update,
    };

    if (saved.date === today) return saved;

    const yesterday = getYesterday();
    const wasGoalMet =
      saved.date === yesterday && saved.sessionCount >= dailyGoal;

    const newData: DailyGoalData = {
      date: today,
      sessionCount: 0,
      streak: wasGoalMet ? saved.streak : 0,
      lastStreakUpdate: null,
    };
    await this.saveDailyGoalData(newData);
    return newData;
  }

  async saveDailyGoalData(data: DailyGoalData): Promise<void> {
    const userId = await this.getUserId();
    await this.supabase.from("daily_goal_data").upsert({
      user_id: userId,
      date: data.date,
      session_count: data.sessionCount,
      streak: data.streak,
      last_streak_update: data.lastStreakUpdate,
      updated_at: new Date().toISOString(),
    });
  }

  // ── Streak History ────────────────────────────────────

  async loadStreakHistory(): Promise<StreakHistory> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("streak_history")
      .select("*")
      .eq("user_id", userId);

    const days: StreakHistory["days"] = {};
    if (data) {
      for (const row of data) {
        days[row.date_key] = {
          sessionCount: row.session_count,
          goalMet: row.goal_met,
          timestamp: row.recorded_at,
        };
      }
    }
    return { days };
  }

  async saveStreakHistory(history: StreakHistory): Promise<void> {
    const userId = await this.getUserId();
    const rows = Object.entries(history.days).map(([dateKey, day]) => ({
      user_id: userId,
      date_key: dateKey,
      session_count: day.sessionCount,
      goal_met: day.goalMet,
      recorded_at: day.timestamp,
    }));

    if (rows.length === 0) return;
    await this.supabase
      .from("streak_history")
      .upsert(rows, { onConflict: "user_id,date_key" });
  }

  async recordDayCompletion(
    date: Date,
    sessionCount: number,
    goalMet: boolean,
  ): Promise<void> {
    const userId = await this.getUserId();
    const dateKey = date.toISOString().split("T")[0];

    await this.supabase.from("streak_history").upsert(
      {
        user_id: userId,
        date_key: dateKey,
        session_count: sessionCount,
        goal_met: goalMet,
        recorded_at: Date.now(),
      },
      { onConflict: "user_id,date_key" },
    );
  }

  // ── Tasks ─────────────────────────────────────────────

  async loadTasks(): Promise<Task[]> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      completed: row.completed,
      sessions: row.sessions,
      timeSpent: row.time_spent,
      createdAt: row.created_at,
      projectId: row.project_id,
      subtasks: row.subtasks ?? [],
    }));
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    const userId = await this.getUserId();

    // Delete all existing tasks and re-insert (simple full-sync approach)
    await this.supabase.from("tasks").delete().eq("user_id", userId);

    if (tasks.length === 0) return;

    const rows = tasks.map((t) => ({
      id: t.id,
      user_id: userId,
      title: t.title,
      completed: t.completed,
      sessions: t.sessions,
      time_spent: t.timeSpent,
      created_at: t.createdAt,
      project_id: t.projectId,
      subtasks: t.subtasks ?? [],
    }));

    await this.supabase.from("tasks").insert(rows);
  }

  // ── Projects ──────────────────────────────────────────

  async loadProjects(): Promise<Project[]> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const projects: Project[] = data
      ? data.map((row) => ({
          id: row.id,
          name: row.name,
          createdAt: row.created_at,
        }))
      : [];

    if (!projects.find((p) => p.id === DEFAULT_PROJECT.id)) {
      return [DEFAULT_PROJECT, ...projects];
    }
    return projects;
  }

  async saveProjects(projects: Project[]): Promise<void> {
    const userId = await this.getUserId();

    await this.supabase.from("projects").delete().eq("user_id", userId);

    if (projects.length === 0) return;

    const rows = projects.map((p) => ({
      id: p.id,
      user_id: userId,
      name: p.name,
      created_at: p.createdAt,
    }));

    await this.supabase.from("projects").insert(rows);
  }

  async loadSelectedProjectId(): Promise<string> {
    const userId = await this.getUserId();
    const { data } = await this.supabase
      .from("user_preferences")
      .select("selected_project_id")
      .eq("user_id", userId)
      .single();

    return data?.selected_project_id ?? DEFAULT_PROJECT.id;
  }

  async saveSelectedProjectId(id: string): Promise<void> {
    const userId = await this.getUserId();
    await this.supabase.from("user_preferences").upsert({
      user_id: userId,
      selected_project_id: id,
    });
  }
}
