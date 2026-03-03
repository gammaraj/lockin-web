import { DEFAULT_PROJECT_ID } from "./types";

// ====== Timer Presets ======

export interface TimerPreset {
  label: string;
  emoji: string;
  workMin: number;
  breakMin: number;
  description: string;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { label: "Classic Pomodoro", emoji: "🍅", workMin: 25, breakMin: 5, description: "The original Pomodoro technique" },
  { label: "Tempo Default", emoji: "⏱️", workMin: 30, breakMin: 5, description: "Balanced 30/5 default" },
  { label: "Short Sprint", emoji: "⚡", workMin: 15, breakMin: 3, description: "Quick bursts for small tasks" },
  { label: "Deep Work", emoji: "🧠", workMin: 50, breakMin: 10, description: "Extended focus sessions" },
  { label: "52/17 Rule", emoji: "📊", workMin: 52, breakMin: 17, description: "Based on productivity research" },
  { label: "Ultra Focus", emoji: "🔥", workMin: 90, breakMin: 20, description: "Maximum deep work block" },
];

// ====== Daily Goal Presets ======

export interface GoalPreset {
  label: string;
  emoji: string;
  sessions: number;
  description: string;
}

export const GOAL_PRESETS: GoalPreset[] = [
  { label: "Light", emoji: "🌱", sessions: 4, description: "~2 hours of focus" },
  { label: "Standard", emoji: "💪", sessions: 8, description: "~4 hours of focus" },
  { label: "Intense", emoji: "🔥", sessions: 12, description: "~6 hours of focus" },
];

// ====== Task Templates ======

export interface TaskTemplate {
  label: string;
  emoji: string;
  description: string;
  tasks: string[];
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    label: "Morning Routine",
    emoji: "🌅",
    description: "Start your day right",
    tasks: ["Plan today's priorities", "Check & respond to emails", "Identify top 3 must-do tasks"],
  },
  {
    label: "Study Session",
    emoji: "📚",
    description: "Structured learning block",
    tasks: ["Review previous notes", "Study new material", "Practice problems / exercises", "Summarize key takeaways"],
  },
  {
    label: "Dev Sprint",
    emoji: "💻",
    description: "Focused coding workflow",
    tasks: ["Plan feature / review requirements", "Implement code changes", "Write tests", "Code review & cleanup"],
  },
  {
    label: "Writing Block",
    emoji: "✍️",
    description: "Focused writing session",
    tasks: ["Outline key points", "Write first draft", "Edit and revise", "Final review & polish"],
  },
  {
    label: "Meeting Prep",
    emoji: "📋",
    description: "Get ready for meetings",
    tasks: ["Review agenda", "Prepare talking points", "Gather required documents", "Note follow-up actions"],
  },
  {
    label: "Weekly Review",
    emoji: "📊",
    description: "End-of-week reflection",
    tasks: ["Review completed tasks", "Assess goal progress", "Identify blockers", "Plan next week's priorities"],
  },
];

/** Convert a task template into Task objects ready to save */
export function templateToTasks(
  template: TaskTemplate,
  projectId: string = DEFAULT_PROJECT_ID
) {
  return template.tasks.map((title) => ({
    id: crypto.randomUUID(),
    title,
    completed: false,
    sessions: 0,
    timeSpent: 0,
    createdAt: Date.now(),
    projectId,
    subtasks: [],
  }));
}
