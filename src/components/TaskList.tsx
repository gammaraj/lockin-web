"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Task, Project, DEFAULT_PROJECT, DEFAULT_PROJECT_ID, Subtask } from "@/lib/types";
import { loadTasks, saveTasks, loadProjects, saveProjects, loadSelectedProjectId, saveSelectedProjectId } from "@/lib/storage";
import { TASK_TEMPLATES, templateToTasks } from "@/lib/templates";
import { useAuth } from "@/components/AuthProvider";

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDueDate(iso: string): string {
  const today = todayDateStr();
  if (iso === today) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (iso === tomorrowStr) return "Tomorrow";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueDateOverdue(iso: string): boolean {
  return iso < todayDateStr();
}

interface TaskListProps {
  activeTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  isTimerRunning: boolean;
}

export default function TaskList({
  activeTaskId,
  onSelectTask,
  onStartTask,
  onCompleteTask,
  isTimerRunning,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Project state
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Close project/template menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
      }
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplateMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    // Wait until auth has resolved so we use the correct adapter (Supabase vs localStorage)
    if (authLoading) return;

    // Load projects
    Promise.all([loadProjects(), loadSelectedProjectId(), loadTasks()]).then(
      ([existingProjects, savedProjectId, existing]) => {
        setProjects(existingProjects);
        if (existingProjects.find((p) => p.id === savedProjectId)) {
          setSelectedProjectId(savedProjectId);
        }

        // Seed sample tasks only for logged-out users with no tasks
        if (existing.length === 0 && !user) {
          const samples: Task[] = [
            { id: crypto.randomUUID(), title: "Review project requirements", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID, subtasks: [] },
            { id: crypto.randomUUID(), title: "Draft design mockups", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID, subtasks: [] },
            { id: crypto.randomUUID(), title: "Write unit tests", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID, subtasks: [] },
          ];
          saveTasks(samples);
          setTasks(samples);
        } else {
          // Migrate tasks missing projectId
          const migrated = existing.map((t) => ({
            ...t,
            projectId: t.projectId || DEFAULT_PROJECT_ID,
          }));
          if (migrated.some((t, i) => t.projectId !== existing[i]?.projectId)) {
            saveTasks(migrated);
          }
          setTasks(migrated);
        }
      }
    );

    const handleUpdate = () => {
      loadTasks().then(setTasks);
      loadProjects().then(setProjects);
    };
    window.addEventListener("tempo-tasks-updated", handleUpdate);

    // Re-sync from Supabase when user switches back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("tempo-tasks-updated", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const persist = useCallback((updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  }, []);

  const persistProjects = useCallback((updated: Project[]) => {
    setProjects(updated);
    saveProjects(updated);
  }, []);

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    saveSelectedProjectId(id);
    setShowProjectMenu(false);
  };

  const addProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
    };
    persistProjects([...projects, project]);
    setNewProjectName("");
    selectProject(project.id);
  };

  const startEditingProject = (p: Project) => {
    setEditingProjectId(p.id);
    setEditProjectName(p.name);
  };

  const saveProjectEdit = () => {
    const name = editProjectName.trim();
    if (!name || !editingProjectId) return;
    persistProjects(
      projects.map((p) => (p.id === editingProjectId ? { ...p, name } : p))
    );
    setEditingProjectId(null);
  };

  const deleteProject = (id: string) => {
    if (id === DEFAULT_PROJECT_ID) return;
    // Move tasks from deleted project to General
    const updated = tasks.map((t) =>
      t.projectId === id ? { ...t, projectId: DEFAULT_PROJECT_ID } : t
    );
    persist(updated);
    persistProjects(projects.filter((p) => p.id !== id));
    if (selectedProjectId === id) selectProject(DEFAULT_PROJECT_ID);
  };

  const addTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      sessions: 0,
      timeSpent: 0,
      createdAt: Date.now(),
      projectId: selectedProjectId,
      subtasks: [],
    };

    persist([...tasks, task]);
    setNewTaskTitle("");
  };

  const toggleComplete = (id: string) => {
    // If completing the active task, stop timer and save time
    if (!tasks.find((t) => t.id === id)?.completed && activeTaskId === id) {
      onCompleteTask(id);
    }
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    persist(updated);
    if (activeTaskId === id) onSelectTask(null);
  };

  const deleteTask = (id: string) => {
    persist(tasks.filter((t) => t.id !== id));
    if (activeTaskId === id) onSelectTask(null);
  };

  const setDueDate = (id: string, date: string | undefined) => {
    persist(tasks.map((t) => (t.id === id ? { ...t, dueDate: date } : t)));
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id: string) => {
    const title = editTitle.trim();
    if (!title) return;
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, title } : t
    );
    persist(updated);
    setEditingId(null);
  };

  const clearCompleted = () => {
    persist(tasks.filter((t) => !(t.completed && t.projectId === selectedProjectId)));
  };

  const archiveCompleted = () => {
    const now = Date.now();
    const updated = tasks.map((t) =>
      t.completed && t.projectId === selectedProjectId && !t.archivedAt
        ? { ...t, archivedAt: now }
        : t
    );
    persist(updated);
  };

  const unarchiveTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, archivedAt: undefined } : t
    );
    persist(updated);
  };

  const deleteArchivedTasks = () => {
    persist(tasks.filter((t) => !(t.archivedAt && t.projectId === selectedProjectId)));
  };

  const handleDragStart = (taskId: string) => {
    setDragTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    setDragOverTaskId(taskId);
  };

  const handleDrop = (targetId: string) => {
    if (!dragTaskId || dragTaskId === targetId) {
      setDragTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    // Reorder within pendingTasks
    const ordered = [...pendingTasks];
    const fromIdx = ordered.findIndex((t) => t.id === dragTaskId);
    const toIdx = ordered.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDragTaskId(null);
      setDragOverTaskId(null);
      return;
    }

    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);

    // Assign order values
    const orderMap = new Map<string, number>();
    ordered.forEach((t, i) => orderMap.set(t.id, i));

    const updated = tasks.map((t) =>
      orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
    );
    persist(updated);
    setDragTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverTaskId(null);
  };

  const moveTask = (taskId: string, direction: "up" | "down") => {
    const ordered = [...pendingTasks];
    const idx = ordered.findIndex((t) => t.id === taskId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ordered.length) return;

    [ordered[idx], ordered[targetIdx]] = [ordered[targetIdx], ordered[idx]];

    const orderMap = new Map<string, number>();
    ordered.forEach((t, i) => orderMap.set(t.id, i));

    const updated = tasks.map((t) =>
      orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
    );
    persist(updated);
  };

  // Subtask helpers
  const addSubtask = (taskId: string) => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    const subtask: Subtask = { id: crypto.randomUUID(), title, completed: false };
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t
    );
    persist(updated);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            subtasks: (t.subtasks || []).map((s) =>
              s.id === subtaskId ? { ...s, completed: !s.completed } : s
            ),
          }
        : t
    );
    persist(updated);
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) }
        : t
    );
    persist(updated);
  };

  const startEditingSubtask = (sub: Subtask) => {
    setEditingSubtaskId(sub.id);
    setEditSubtaskTitle(sub.title);
  };

  const saveSubtaskEdit = (taskId: string, subtaskId: string) => {
    const title = editSubtaskTitle.trim();
    if (!title) { setEditingSubtaskId(null); return; }
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            subtasks: (t.subtasks || []).map((s) =>
              s.id === subtaskId ? { ...s, title } : s
            ),
          }
        : t
    );
    persist(updated);
    setEditingSubtaskId(null);
  };

  // Filter tasks for the selected project
  const projectTasks = tasks.filter((t) => t.projectId === selectedProjectId && !t.archivedAt);
  const pendingTasks = projectTasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  const completedTasks = projectTasks.filter((t) => t.completed);
  const archivedTasks = tasks.filter((t) => t.projectId === selectedProjectId && t.archivedAt);
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="bg-white/80 dark:bg-[#111827] backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-[#1e3050] overflow-visible">
      {/* Header */}
      <div
        className="px-4 sm:px-5 py-4 text-white rounded-t-2xl"
        style={{ background: "linear-gradient(135deg, #0f1b33 0%, #1a2d4a 100%)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Tasks
          </h2>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "calendar" ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"}`}
              title="Calendar view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <TaskCalendarView
          tasks={tasks}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          onSetDueDate={setDueDate}
          activeTaskId={activeTaskId}
          onStartTask={onStartTask}
          isTimerRunning={isTimerRunning}
        />
      )}

      {/* Project tabs */}
      {viewMode === "list" && (<>
      <div className="px-4 pt-3 pb-1 relative" ref={projectMenuRef}>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {projects.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                p.id === selectedProjectId
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#131d30] hover:bg-slate-200 dark:hover:bg-[#1a2d4a]"
              }`}
            >
              <span className="truncate max-w-[100px]">{p.name}</span>
              <span className={`text-xs ${
                p.id === selectedProjectId
                  ? "text-blue-200"
                  : "text-slate-400 dark:text-slate-500"
              }`}>
                {tasks.filter((t) => t.projectId === p.id && !t.completed).length}
              </span>
            </button>
          ))}

          {/* Add project button */}
          <button
            onClick={() => { setShowAddProject(!showAddProject); setNewProjectName(""); }}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              showAddProject
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-[#131d30] hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title="Add project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* More / manage button */}
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
              showProjectMenu
                ? "bg-slate-200 dark:bg-[#1a2d4a] text-slate-700 dark:text-slate-200"
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-[#131d30] hover:text-slate-600 dark:hover:text-slate-300"
            }`}
            title="Manage projects"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
            </svg>
          </button>
        </div>

        {/* Inline add project input */}
        {showAddProject && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addProject();
              setShowAddProject(false);
            }}
            className="flex gap-1.5 mt-2"
          >
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Escape") setShowAddProject(false); }}
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="px-2.5 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </form>
        )}

        {/* Dropdown for managing projects + overflow */}
        {showProjectMenu && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {projects.map((p) => (
                  <div
                  key={p.id}
                  className={`group/proj flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                    p.id === selectedProjectId
                      ? "bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-200"
                      : "text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#1a2d4a]"
                  }`}
                >
                  {editingProjectId === p.id ? (
                    <input
                      type="text"
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      onBlur={saveProjectEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveProjectEdit();
                        if (e.key === "Escape") setEditingProjectId(null);
                      }}
                      className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span
                        className="flex-1 truncate"
                        onClick={() => selectProject(p.id)}
                      >
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {tasks.filter((t) => t.projectId === p.id && !t.completed).length}
                      </span>
                      {p.id !== DEFAULT_PROJECT_ID && (
                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover/proj:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingProject(p);
                            }}
                            className="p-0.5 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Rename"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(p.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete project"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add new project */}
            <div className="border-t border-slate-100 dark:border-[#243350] p-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addProject();
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="New project..."
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 dark:border-[#243350] rounded bg-white dark:bg-[#131d30] dark:text-white outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-2.5 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      <div className="p-4 space-y-3">
        {/* Add task input */}
        <div className="flex gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
          className="flex gap-2 flex-1"
        >
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={`Add a task to ${currentProject?.name ?? "General"}...`}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-[#243350] rounded-lg bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
          />
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </form>

        {/* Template button */}
        <div className="relative" ref={templateMenuRef}>
          <button
            type="button"
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors"
            title="Load task template"
          >
            📋 <span className="hidden sm:inline">Templates</span>
          </button>
          {showTemplateMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] rounded-lg shadow-xl z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-[#243350] rounded-t-lg">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide">Task Templates</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto rounded-b-lg">
                {TASK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      const newTasks = templateToTasks(tpl, selectedProjectId);
                      persist([...tasks, ...newTasks]);
                      setShowTemplateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition-colors border-b border-slate-50 dark:border-[#1e3050]/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{tpl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{tpl.label}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-400">{tpl.description} · {tpl.tasks.length} tasks</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Empty state with template gallery */}
        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <div className="py-4">
            <div className="text-center mb-4">
              <p className="text-slate-500 dark:text-slate-300 text-base mb-1">No tasks yet</p>
              <p className="text-slate-400 dark:text-slate-400 text-sm">Add a task above or pick a template to get started</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TASK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    const newTasks = templateToTasks(tpl, selectedProjectId);
                    persist([...tasks, ...newTasks]);
                  }}
                  className="text-left p-3 rounded-xl border border-slate-100 dark:border-[#1e3050] hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all group"
                >
                  <div className="text-xl mb-1">{tpl.emoji}</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-200 transition-colors">{tpl.label}</div>
                  <div className="text-sm text-slate-400 dark:text-slate-400">{tpl.tasks.length} tasks</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {pendingTasks.map((task) => {
            const subtasks = task.subtasks || [];
            const completedSubtasks = subtasks.filter((s) => s.completed).length;
            const hasSubtasks = subtasks.length > 0;
            const isExpanded = expandedTaskId === task.id;

            return (
            <div key={task.id}>
            <div
              draggable
              onDragStart={() => handleDragStart(task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDrop={() => handleDrop(task.id)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                activeTaskId === task.id
                  ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-[#1e3050] hover:bg-slate-50 dark:hover:bg-[#131d30]"
              } ${isExpanded ? "rounded-b-none" : ""} ${
                dragTaskId === task.id ? "opacity-50" : ""
              } ${
                dragOverTaskId === task.id && dragTaskId !== task.id
                  ? "border-t-2 border-t-blue-500"
                  : ""
              }`}
            >
              {/* Drag handle (desktop) / Move buttons (mobile) */}
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                {/* Desktop: drag handle */}
                <div className="hidden sm:block cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                  </svg>
                </div>
                {/* Mobile: up/down buttons */}
                {pendingTasks.length > 1 && (
                  <div className="sm:hidden flex flex-col -my-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveTask(task.id, "up"); }}
                      disabled={pendingTasks[0]?.id === task.id}
                      className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 disabled:opacity-0 transition-all"
                      aria-label="Move up"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveTask(task.id, "down"); }}
                      disabled={pendingTasks[pendingTasks.length - 1]?.id === task.id}
                      className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 disabled:opacity-0 transition-all"
                      aria-label="Move down"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {/* Checkbox */}
              <button
                onClick={() => toggleComplete(task.id)}
                className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center"
                aria-label={`Mark "${task.title}" complete`}
              />

              {/* Task content */}
              <div className="flex-1 min-w-0">
                {editingId === task.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEdit(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(task.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full px-2 py-1 text-[15px] border border-blue-300 rounded-lg bg-white dark:bg-[#131d30] dark:text-white outline-none"
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-[15px] font-medium text-slate-800 dark:text-slate-50 break-words cursor-pointer leading-snug"
                    onDoubleClick={() => startEditing(task)}
                  >
                    {task.title}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {/* Inline action icons — edit & due date */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => startEditing(task)}
                      className="p-0.5 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      aria-label={`Edit "${task.title}"`}
                      title="Edit task"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const input = document.getElementById(`due-${task.id}`) as HTMLInputElement;
                        input?.showPicker();
                      }}
                      className="p-0.5 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      title={task.dueDate ? `Due: ${formatDueDate(task.dueDate)}` : "Set due date"}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <input
                      id={`due-${task.id}`}
                      type="date"
                      className="absolute w-0 h-0 opacity-0 pointer-events-none"
                      value={task.dueDate ?? ""}
                      onChange={(e) => setDueDate(task.id, e.target.value || undefined)}
                    />
                  </div>
                  {(task.dueDate || hasSubtasks || task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                  )}
                  {task.dueDate && (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      task.completed
                        ? "text-slate-400 dark:text-slate-500"
                        : isDueDateOverdue(task.dueDate)
                          ? "text-red-500 dark:text-red-400"
                          : task.dueDate === todayDateStr()
                            ? "text-orange-500 dark:text-orange-400"
                            : "text-slate-500 dark:text-slate-400"
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDueDate(task.dueDate)}
                      {!task.completed && isDueDateOverdue(task.dueDate) && " (overdue)"}
                    </span>
                  )}
                  {hasSubtasks && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {completedSubtasks}/{subtasks.length} subtask{subtasks.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {hasSubtasks && (task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                  )}
                  {(task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {task.sessions > 0 && (
                        <>{task.sessions} session{task.sessions !== 1 ? "s" : ""}</>
                      )}
                      {task.sessions > 0 && (task.timeSpent || 0) > 0 && " · "}
                      {(task.timeSpent || 0) > 0 && formatDuration(task.timeSpent)}
                    </span>
                  )}
                </div>
              </div>

              {/* Expand subtasks toggle */}
              <button
                onClick={() => {
                  setExpandedTaskId(isExpanded ? null : task.id);
                  setNewSubtaskTitle("");
                }}
                className={`flex-shrink-0 rounded-md transition-all flex items-center gap-1 ${
                  isExpanded
                    ? "text-blue-500 dark:text-blue-400 p-1"
                    : hasSubtasks
                      ? "text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 px-1.5 py-0.5"
                      : "text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1"
                }`}
                title={isExpanded ? "Collapse subtasks" : hasSubtasks ? "Expand subtasks" : "Add subtask"}
              >
                {hasSubtasks && !isExpanded ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs">{completedSubtasks}/{subtasks.length}</span>
                  </>
                ) : (
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>

              {/* Start / Select / In-progress button */}
              {activeTaskId === task.id && isTimerRunning ? (
                <span className="flex-shrink-0 px-2 py-1 text-sm font-medium rounded bg-blue-600 text-white flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  In progress
                </span>
              ) : (
                <button
                  onClick={() => {
                    if (activeTaskId === task.id) {
                      onSelectTask(null);
                    } else {
                      onStartTask(task.id);
                    }
                  }}
                  className={`flex-shrink-0 px-2.5 py-1 text-sm font-medium rounded transition-colors flex items-center gap-1 ${
                    activeTaskId === task.id
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      : "bg-blue-600 text-white hover:bg-blue-700 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  }`}
                  title={
                    activeTaskId === task.id
                      ? "Deselect task"
                      : isTimerRunning
                        ? "Switch to this task"
                        : "Start working on this task"
                  }
                >
                  {activeTaskId === task.id ? (
                    "Selected"
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      {isTimerRunning ? "Switch" : "Start"}
                    </>
                  )}
                </button>
              )}

              {/* Delete (hidden only for the active task while timer runs) */}
              {!(isTimerRunning && activeTaskId === task.id) && (
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                  aria-label={`Delete "${task.title}"`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Subtasks panel */}
            {isExpanded && (
              <div className={`border border-t-0 rounded-b-xl py-3 space-y-1 ${
                activeTaskId === task.id
                  ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                  : "border-slate-200 dark:border-[#1e3050] bg-slate-50/50 dark:bg-[#131d30]/50"
              }`}>
                {/* Existing subtasks */}
                {subtasks.map((sub) => (
                  <div key={sub.id} className="group/sub flex items-center gap-2.5 py-1 pl-6 pr-4 ml-4 border-l-2 border-slate-200 dark:border-[#243350]">
                    <button
                      onClick={() => toggleSubtask(task.id, sub.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-[1.5px] transition-colors flex items-center justify-center ${
                        sub.completed
                          ? "border-green-400 bg-green-500"
                          : "border-slate-300 dark:border-slate-600 hover:border-blue-500"
                      }`}
                    >
                      {sub.completed && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    {editingSubtaskId === sub.id ? (
                      <input
                        type="text"
                        value={editSubtaskTitle}
                        onChange={(e) => setEditSubtaskTitle(e.target.value)}
                        onBlur={() => saveSubtaskEdit(task.id, sub.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveSubtaskEdit(task.id, sub.id);
                          if (e.key === "Escape") setEditingSubtaskId(null);
                        }}
                        className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-[#131d30] dark:text-white outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                    <span className={`flex-1 text-sm cursor-pointer ${
                      sub.completed
                        ? "text-slate-400 dark:text-slate-500 line-through"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                      onDoubleClick={() => startEditingSubtask(sub)}
                      onClick={() => startEditingSubtask(sub)}
                    >
                      {sub.title}
                    </span>
                    )}
                    <button
                      onClick={() => deleteSubtask(task.id, sub.id)}
                      className="flex-shrink-0 p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover/sub:opacity-100 transition-all"
                      aria-label={`Delete subtask "${sub.title}"`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add subtask input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addSubtask(task.id);
                  }}
                  className="flex items-center gap-2 pl-6 pr-4 ml-4 border-l-2 border-slate-200 dark:border-[#243350] pt-1"
                >
                  <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-2 py-1 text-sm border border-slate-200 dark:border-[#243350] rounded-md bg-white dark:bg-[#131d30] dark:text-white focus:border-blue-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
            </div>
            );
          })}
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1e3050]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide">
                Completed ({completedTasks.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={archiveCompleted}
                  className="text-sm text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                  title="Archive completed tasks"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archive
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${completedTasks.length} completed task${completedTasks.length !== 1 ? "s" : ""}? This cannot be undone.`)) {
                      clearCompleted();
                    }
                  }}
                  className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                >
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="flex-shrink-0 w-5 h-5 rounded border-2 border-green-400 bg-green-500 flex items-center justify-center"
                    aria-label={`Mark "${task.title}" incomplete`}
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                  <span className="text-sm text-slate-400 dark:text-slate-400 line-through truncate">
                    {task.title}
                  </span>
                  {((task.timeSpent || 0) > 0 || task.sessions > 0) && (
                    <span className="text-xs text-slate-400 dark:text-slate-400 ml-auto flex-shrink-0">
                      {(task.timeSpent || 0) > 0 ? formatDuration(task.timeSpent) : `${task.sessions}s`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archived tasks */}
        {viewMode === "list" && archivedTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1e3050]">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-full"
            >
              <svg className={`w-3 h-3 transition-transform ${showArchived ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archived ({archivedTasks.length})
              <span className="ml-auto">
                {showArchived && (
                  <span
                    onClick={(e) => { e.stopPropagation(); deleteArchivedTasks(); }}
                    className="text-xs normal-case font-normal text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Delete all
                  </span>
                )}
              </span>
            </button>
            {showArchived && (
              <div className="space-y-1 mt-1.5">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center gap-2 p-2 rounded-lg"
                  >
                    <svg className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="text-sm text-slate-400 dark:text-slate-500 line-through truncate">
                      {task.title}
                    </span>
                    <button
                      onClick={() => unarchiveTask(task.id)}
                      className="ml-auto flex-shrink-0 text-xs text-slate-400 hover:text-blue-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                      title="Unarchive"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Task Calendar View
// ═══════════════════════════════════════════════════════

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function TaskCalendarView({
  tasks,
  calendarDate,
  setCalendarDate,
  onSetDueDate,
  activeTaskId,
  onStartTask,
  isTimerRunning,
}: {
  tasks: Task[];
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  onSetDueDate: (id: string, date: string | undefined) => void;
  activeTaskId: string | null;
  onStartTask: (taskId: string) => void;
  isTimerRunning: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDow = new Date(year, month, 1).getDay();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Build a map: dateKey → tasks with that due date
  const tasksByDate: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (t.dueDate && !t.archivedAt) {
      (tasksByDate[t.dueDate] ??= []).push(t);
    }
  }

  // Tasks with no due date
  const unscheduledTasks = tasks.filter((t) => !t.dueDate && !t.completed && !t.archivedAt);

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCalendarDate(new Date());
    setSelectedDay(todayStr);
  };

  const emptyCells = Array.from({ length: startingDow });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] ?? []) : [];

  return (
    <div className="p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={goToday}
            className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((_, i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {dayCells.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          const isPast = dateStr < todayStr;
          const hasOverdue = isPast && dayTasks.some((t) => !t.completed);

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs transition-all relative ${
                isSelected
                  ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-[#111827]"
                  : isToday
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-300 dark:ring-blue-700"
                    : "hover:bg-slate-100 dark:hover:bg-[#1a2d4a] text-slate-600 dark:text-slate-300"
              }`}
            >
              <span className={`text-[11px] font-medium ${isSelected ? "text-white" : ""}`}>{day}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5">
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-white/70"
                          : t.completed
                            ? "bg-green-400"
                            : hasOverdue && !t.completed
                              ? "bg-red-400"
                              : "bg-blue-400"
                      }`}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className={`text-[8px] leading-none ${isSelected ? "text-white/70" : "text-slate-400"}`}>+{dayTasks.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Pending</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /> Done</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Overdue</div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e3050]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatDueDate(selectedDay)}
              {selectedDay === todayStr && " — Today"}
            </h4>
            <span className="text-xs text-slate-400">{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No tasks due on this day.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                    task.completed
                      ? "border-slate-100 dark:border-[#1e3050] opacity-60"
                      : activeTaskId === task.id
                        ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : selectedDay < todayStr
                          ? "border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10"
                          : "border-slate-200 dark:border-[#1e3050]"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.completed ? "bg-green-400" : selectedDay < todayStr ? "bg-red-400" : "bg-blue-400"
                  }`} />
                  <span className={`text-sm flex-1 truncate ${
                    task.completed
                      ? "line-through text-slate-400"
                      : "text-slate-700 dark:text-slate-200 font-medium"
                  }`}>
                    {task.title}
                  </span>
                  {!task.completed && (
                    <button
                      onClick={() => onStartTask(task.id)}
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      {isTimerRunning ? "Switch" : "Start"}
                    </button>
                  )}
                  <button
                    onClick={() => onSetDueDate(task.id, undefined)}
                    className="flex-shrink-0 p-1 text-slate-400 dark:text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove due date"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unscheduled tasks */}
      {unscheduledTasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1e3050]">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            No due date ({unscheduledTasks.length})
          </h4>
          <div className="space-y-1">
            {unscheduledTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1">{task.title}</span>
                <label className="flex-shrink-0 p-1 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer" title="Set due date">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    className="sr-only"
                    onChange={(e) => { if (e.target.value) onSetDueDate(task.id, e.target.value); }}
                  />
                </label>
              </div>
            ))}
            {unscheduledTasks.length > 8 && (
              <p className="text-xs text-slate-400 text-center">+{unscheduledTasks.length - 8} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
