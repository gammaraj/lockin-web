"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Task, Project, DEFAULT_PROJECT, DEFAULT_PROJECT_ID } from "@/lib/types";
import { loadTasks, saveTasks, loadProjects, saveProjects, loadSelectedProjectId, saveSelectedProjectId } from "@/lib/storage";
import { TASK_TEMPLATES, templateToTasks } from "@/lib/templates";

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Project state
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
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
    // Load projects
    Promise.all([loadProjects(), loadSelectedProjectId(), loadTasks()]).then(
      ([existingProjects, savedProjectId, existing]) => {
        setProjects(existingProjects);
        if (existingProjects.find((p) => p.id === savedProjectId)) {
          setSelectedProjectId(savedProjectId);
        }

        // Load tasks — migrate old tasks without projectId
        if (existing.length === 0) {
          const samples: Task[] = [
            { id: crypto.randomUUID(), title: "Review project requirements", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID },
            { id: crypto.randomUUID(), title: "Draft design mockups", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID },
            { id: crypto.randomUUID(), title: "Write unit tests", completed: false, sessions: 0, timeSpent: 0, createdAt: Date.now(), projectId: DEFAULT_PROJECT_ID },
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
    };
    window.addEventListener("tempo-tasks-updated", handleUpdate);
    return () => window.removeEventListener("tempo-tasks-updated", handleUpdate);
  }, []);

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

  // Filter tasks for the selected project
  const projectTasks = tasks.filter((t) => t.projectId === selectedProjectId);
  const pendingTasks = projectTasks.filter((t) => !t.completed);
  const completedTasks = projectTasks.filter((t) => t.completed);
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="bg-white/80 dark:bg-gray-900 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-gray-800 overflow-visible">
      {/* Header */}
      <div
        className="px-4 sm:px-5 py-4 text-white rounded-t-2xl"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
      >
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
      </div>

      {/* Project selector */}
      <div className="px-4 pt-3 pb-1 relative" ref={projectMenuRef}>
        <button
          onClick={() => setShowProjectMenu(!showProjectMenu)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="flex-1 text-left truncate">{currentProject?.name ?? "General"}</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${showProjectMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {showProjectMenu && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {projects.map((p) => (
                  <div
                  key={p.id}
                  className={`group/proj flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                    p.id === selectedProjectId
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
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
                      className="flex-1 px-1 py-0.5 text-sm border border-blue-300 rounded bg-white dark:bg-gray-800 dark:text-white outline-none"
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
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/proj:opacity-100 transition-opacity">
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
            <div className="border-t border-slate-100 dark:border-slate-700 p-2">
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
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-gray-700 dark:text-white outline-none focus:border-blue-400"
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
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
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
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors"
            title="Load task template"
          >
            📋 <span>Templates</span>
          </button>
          {showTemplateMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 rounded-t-lg">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Task Templates</span>
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
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{tpl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{tpl.label}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{tpl.description} · {tpl.tasks.length} tasks</div>
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
              <p className="text-slate-500 dark:text-slate-400 text-base mb-1">No tasks yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Add a task above or pick a template to get started</p>
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
                  className="text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all group"
                >
                  <div className="text-xl mb-1">{tpl.emoji}</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{tpl.label}</div>
                  <div className="text-sm text-slate-400 dark:text-slate-500">{tpl.tasks.length} tasks</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                activeTaskId === task.id
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleComplete(task.id)}
                className="flex-shrink-0 w-[22px] h-[22px] rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center"
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
                    className="w-full px-2 py-1 text-[15px] border border-blue-300 rounded-lg bg-white dark:bg-gray-800 dark:text-white outline-none"
                    autoFocus
                  />
                ) : (
                  <div
                    className="text-[15px] font-medium text-slate-800 dark:text-slate-100 truncate cursor-pointer leading-snug"
                    onDoubleClick={() => startEditing(task)}
                  >
                    {task.title}
                  </div>
                )}
                {(task.sessions > 0 || (task.timeSpent || 0) > 0) && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {task.sessions > 0 && (
                      <span>{task.sessions} session{task.sessions !== 1 ? "s" : ""}</span>
                    )}
                    {task.sessions > 0 && (task.timeSpent || 0) > 0 && " · "}
                    {(task.timeSpent || 0) > 0 && (
                      <span>{formatDuration(task.timeSpent)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Start / Stop button */}
              {!isTimerRunning && (
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
                      : "bg-blue-600 text-white hover:bg-blue-700 opacity-0 group-hover:opacity-100"
                  }`}
                  title={
                    activeTaskId === task.id
                      ? "Deselect task"
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
                      Start
                    </>
                  )}
                </button>
              )}
              {isTimerRunning && activeTaskId === task.id && (
                <span className="flex-shrink-0 px-2 py-1 text-sm font-medium rounded bg-blue-600 text-white flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  In progress
                </span>
              )}

              {/* Delete */}
              {!isTimerRunning && (
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
          ))}
        </div>

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Completed ({completedTasks.length})
              </span>
              <button
                onClick={clearCompleted}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
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
                  <span className="text-sm text-slate-400 dark:text-slate-500 line-through truncate">
                    {task.title}
                  </span>
                  {((task.timeSpent || 0) > 0 || task.sessions > 0) && (
                    <span className="text-xs text-slate-300 dark:text-slate-600 ml-auto flex-shrink-0">
                      {(task.timeSpent || 0) > 0 ? formatDuration(task.timeSpent) : `${task.sessions}s`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
