"use client";

import React, { useState, useRef } from "react";
import { Task, Subtask, DEFAULT_PROJECT_ID } from "@/lib/types";
import { loadTasks, saveTasks } from "@/lib/storage";

// ── CSV helpers ─────────────────────────────────────────

/** Parse a single CSV row, respecting quoted fields */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(parseCSVRow);
  return { headers, rows };
}

function findColumn(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Try ISO date
  const isoMatch = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  // Try MM/DD/YYYY or M/D/YYYY
  const usMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`;
  }
  // Try natural date parsing as fallback
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

function uuid(): string {
  return crypto.randomUUID();
}

// ── Platform parsers ────────────────────────────────────

type ParsedTask = Pick<Task, "title"> & {
  completed?: boolean;
  dueDate?: string;
  subtasks?: Pick<Subtask, "title" | "completed">[];
};

function parseGoogleTasksJSON(text: string): ParsedTask[] | null {
  try {
    const data = JSON.parse(text);
    // Google Tasks Takeout format: { items: [...] } or { kind: "tasks#tasks", items: [...] }
    // or array of task lists: [{ title, items: [...] }]
    const lists = Array.isArray(data) ? data : data.items ? [data] : null;
    if (!lists) return null;

    const results: ParsedTask[] = [];
    for (const list of lists) {
      const items = list.items || list;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item.title && !item.name) continue;
        results.push({
          title: (item.title || item.name || "").trim(),
          completed: item.status === "completed" || item.completed === true,
          dueDate: normalizeDate(item.due || item.dueDate),
        });
      }
    }
    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}

function parseFociJSON(text: string): ParsedTask[] | null {
  try {
    const data = JSON.parse(text);
    const tasks: unknown[] = Array.isArray(data) ? data : data.tasks;
    if (!Array.isArray(tasks)) return null;

    // Check if this is Foci format (has projectId or sessions field)
    const first = tasks[0] as Record<string, unknown>;
    if (!first || (!("projectId" in first) && !("sessions" in first) && !("timeSpent" in first))) {
      return null;
    }

    return (tasks as Record<string, unknown>[]).map((t) => ({
      title: String(t.title || ""),
      completed: Boolean(t.completed),
      dueDate: t.dueDate ? String(t.dueDate) : undefined,
      subtasks: Array.isArray(t.subtasks)
        ? (t.subtasks as Record<string, unknown>[]).map((s) => ({
            title: String(s.title || ""),
            completed: Boolean(s.completed),
          }))
        : undefined,
    }));
  } catch {
    return null;
  }
}

function parseTodoistCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const contentIdx = findColumn(headers, "content", "task name", "task_name");
  if (contentIdx === -1) return null;
  const dueDateIdx = findColumn(headers, "due date", "due_date", "deadline");
  const completedIdx = findColumn(headers, "is completed", "is_completed", "completed");
  const typeIdx = findColumn(headers, "type");

  // Todoist CSVs have a "type" column with "task" value
  if (typeIdx === -1 && !headers.some((h) => h.includes("content"))) return null;

  return rows
    .filter((r) => {
      if (typeIdx !== -1 && r[typeIdx] && r[typeIdx].toLowerCase() !== "task") return false;
      return r[contentIdx]?.trim();
    })
    .map((r) => ({
      title: r[contentIdx].trim(),
      completed: completedIdx !== -1 ? r[completedIdx] === "1" || r[completedIdx]?.toLowerCase() === "true" : false,
      dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
    }));
}

function parseAsanaCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const nameIdx = findColumn(headers, "name", "task name");
  if (nameIdx === -1) return null;
  const dueDateIdx = findColumn(headers, "due date", "due_date", "deadline");
  const completedIdx = findColumn(headers, "completed", "completed at", "completed_at");
  // Asana CSVs typically have "Section/Column" or "Assignee"
  const sectionIdx = findColumn(headers, "section", "column");
  const assigneeIdx = findColumn(headers, "assignee");
  if (sectionIdx === -1 && assigneeIdx === -1) return null;

  return rows
    .filter((r) => r[nameIdx]?.trim())
    .map((r) => ({
      title: r[nameIdx].trim(),
      completed: completedIdx !== -1 ? Boolean(r[completedIdx]?.trim()) : false,
      dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
    }));
}

function parseNotionCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const nameIdx = findColumn(headers, "name", "title", "task");
  if (nameIdx === -1) return null;
  const statusIdx = findColumn(headers, "status", "state");
  const dueDateIdx = findColumn(headers, "due", "date", "deadline");

  return rows
    .filter((r) => r[nameIdx]?.trim())
    .map((r) => {
      const status = statusIdx !== -1 ? r[statusIdx]?.toLowerCase() : "";
      return {
        title: r[nameIdx].trim(),
        completed: status === "done" || status === "completed" || status === "complete",
        dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
      };
    });
}

function parseGenericCSV(headers: string[], rows: string[][]): ParsedTask[] | null {
  const nameIdx = findColumn(headers, "title", "name", "task", "summary", "subject", "description", "to-do", "todo");
  if (nameIdx === -1) return null;
  const dueDateIdx = findColumn(headers, "due", "date", "deadline");
  const completedIdx = findColumn(headers, "completed", "done", "status", "complete");

  return rows
    .filter((r) => r[nameIdx]?.trim())
    .map((r) => {
      let completed = false;
      if (completedIdx !== -1) {
        const val = r[completedIdx]?.toLowerCase() || "";
        completed = val === "true" || val === "1" || val === "yes" || val === "done" || val === "completed" || val === "complete";
      }
      return {
        title: r[nameIdx].trim(),
        completed,
        dueDate: dueDateIdx !== -1 ? normalizeDate(r[dueDateIdx]) : undefined,
      };
    });
}

// ── Detect and parse ────────────────────────────────────

type DetectedFormat = "foci" | "google-tasks" | "todoist" | "asana" | "notion" | "csv" | "unknown";

function detectAndParse(
  text: string,
  fileName: string
): { format: DetectedFormat; tasks: ParsedTask[] } {
  const ext = fileName.split(".").pop()?.toLowerCase();

  // Try JSON formats first
  if (ext === "json" || text.trimStart().startsWith("{") || text.trimStart().startsWith("[")) {
    const foci = parseFociJSON(text);
    if (foci) return { format: "foci", tasks: foci };
    const google = parseGoogleTasksJSON(text);
    if (google) return { format: "google-tasks", tasks: google };
  }

  // CSV-based formats
  if (ext === "csv" || text.includes(",")) {
    const { headers, rows } = parseCSV(text);
    if (headers.length === 0) return { format: "unknown", tasks: [] };

    const todoist = parseTodoistCSV(headers, rows);
    if (todoist && todoist.length > 0) return { format: "todoist", tasks: todoist };

    const asana = parseAsanaCSV(headers, rows);
    if (asana && asana.length > 0) return { format: "asana", tasks: asana };

    const notion = parseNotionCSV(headers, rows);
    if (notion && notion.length > 0) return { format: "notion", tasks: notion };

    const generic = parseGenericCSV(headers, rows);
    if (generic && generic.length > 0) return { format: "csv", tasks: generic };
  }

  return { format: "unknown", tasks: [] };
}

// ── Convert to Foci tasks ───────────────────────────────

function toFociTasks(parsed: ParsedTask[], projectId: string): Task[] {
  const now = Date.now();
  return parsed.map((p, i) => ({
    id: uuid(),
    title: p.title.slice(0, 200),
    completed: p.completed || false,
    sessions: 0,
    timeSpent: 0,
    createdAt: now + i, // ensure unique ordering
    projectId,
    subtasks: p.subtasks?.map((s) => ({
      id: uuid(),
      title: s.title.slice(0, 200),
      completed: s.completed || false,
    })),
    order: i,
    dueDate: p.dueDate,
  }));
}

// ── Export helpers ───────────────────────────────────────

function exportToJSON(tasks: Task[]): string {
  return JSON.stringify({ tasks, exportedAt: new Date().toISOString(), format: "foci" }, null, 2);
}

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportToCSV(tasks: Task[]): string {
  const headers = ["Title", "Completed", "Due Date", "Sessions", "Time Spent (min)", "Project ID", "Created At"];
  const rows = tasks.map((t) => [
    escapeCSVField(t.title),
    t.completed ? "Yes" : "No",
    t.dueDate || "",
    String(t.sessions),
    String(Math.round(t.timeSpent / 60000)),
    t.projectId,
    new Date(t.createdAt).toISOString(),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Format display names ────────────────────────────────

const FORMAT_LABELS: Record<DetectedFormat, string> = {
  foci: "Foci",
  "google-tasks": "Google Tasks",
  todoist: "Todoist",
  asana: "Asana",
  notion: "Notion",
  csv: "CSV",
  unknown: "Unknown",
};

// ── Component ───────────────────────────────────────────

interface TaskImportExportProps {
  onTasksImported?: () => void;
}

export default function TaskImportExport({ onTasksImported }: TaskImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<
    | { step: "idle" }
    | { step: "preview"; format: DetectedFormat; tasks: ParsedTask[]; fileName: string }
    | { step: "importing" }
    | { step: "done"; count: number }
    | { step: "error"; message: string }
  >({ step: "idle" });
  const [importCompleted, setImportCompleted] = useState(true); // whether to import completed tasks too
  const [exporting, setExporting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setImportState({ step: "error", message: "File too large. Maximum size is 5 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") {
        setImportState({ step: "error", message: "Could not read file." });
        return;
      }

      const { format, tasks } = detectAndParse(text, file.name);
      if (format === "unknown" || tasks.length === 0) {
        setImportState({
          step: "error",
          message: "Could not detect format. Supported: Foci JSON, Google Tasks JSON, Todoist CSV, Asana CSV, Notion CSV, or any CSV with a Title/Name column.",
        });
      } else {
        setImportState({ step: "preview", format, tasks, fileName: file.name });
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleImport = async () => {
    if (importState.step !== "preview") return;
    setImportState({ step: "importing" });

    try {
      let tasksToImport = importState.tasks;
      if (!importCompleted) {
        tasksToImport = tasksToImport.filter((t) => !t.completed);
      }
      const newTasks = toFociTasks(tasksToImport, DEFAULT_PROJECT_ID);
      const existing = await loadTasks();
      await saveTasks([...existing, ...newTasks]);
      setImportState({ step: "done", count: newTasks.length });
      onTasksImported?.();
    } catch {
      setImportState({ step: "error", message: "Failed to import tasks. Please try again." });
    }
  };

  const handleExport = async (type: "json" | "csv") => {
    setExporting(true);
    try {
      const tasks = await loadTasks();
      if (tasks.length === 0) {
        setImportState({ step: "error", message: "No tasks to export." });
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      if (type === "json") {
        downloadFile(exportToJSON(tasks), `foci-tasks-${date}.json`, "application/json");
      } else {
        downloadFile(exportToCSV(tasks), `foci-tasks-${date}.csv`, "text/csv");
      }
    } finally {
      setExporting(false);
    }
  };

  const filteredCount =
    importState.step === "preview" && !importCompleted
      ? importState.tasks.filter((t) => !t.completed).length
      : importState.step === "preview"
        ? importState.tasks.length
        : 0;

  return (
    <div className="space-y-3">
      {/* Export */}
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Download all your tasks as a backup or to use in another app.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport("json")}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
            Export JSON
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport("csv")}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#243350] bg-white dark:bg-[#131d30] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1a2d4a] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-[#243350]" />

      {/* Import */}
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Import tasks from Google Tasks, Todoist, Asana, Notion, or any CSV file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border-2 border-dashed border-slate-300 dark:border-[#243350] text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition bg-slate-50/50 dark:bg-[#131d30]/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Choose file to import...
        </button>

        {/* Import Preview */}
        {importState.step === "preview" && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {FORMAT_LABELS[importState.format]}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {importState.fileName}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Found <strong>{importState.tasks.length}</strong> task{importState.tasks.length !== 1 ? "s" : ""}
              {importState.tasks.filter((t) => t.completed).length > 0 && (
                <span className="text-slate-500 dark:text-slate-400">
                  {" "}({importState.tasks.filter((t) => t.completed).length} completed)
                </span>
              )}
            </p>

            {/* Preview list (max 5) */}
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 max-h-28 overflow-y-auto">
              {importState.tasks.slice(0, 5).map((t, i) => (
                <li key={i} className="flex items-center gap-1.5 truncate">
                  <span className={t.completed ? "line-through text-slate-400" : ""}>{t.title}</span>
                  {t.dueDate && (
                    <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
                      · {t.dueDate}
                    </span>
                  )}
                </li>
              ))}
              {importState.tasks.length > 5 && (
                <li className="text-slate-400 dark:text-slate-500">
                  …and {importState.tasks.length - 5} more
                </li>
              )}
            </ul>

            {/* Include completed toggle */}
            {importState.tasks.some((t) => t.completed) && (
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importCompleted}
                  onChange={(e) => setImportCompleted(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                Include completed tasks
              </label>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleImport}
                disabled={filteredCount === 0}
                className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition disabled:opacity-50"
              >
                Import {filteredCount} task{filteredCount !== 1 ? "s" : ""}
              </button>
              <button
                type="button"
                onClick={() => setImportState({ step: "idle" })}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-[#243350] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2d4a] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Importing spinner */}
        {importState.step === "importing" && (
          <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Importing…
          </div>
        )}

        {/* Success */}
        {importState.step === "done" && (
          <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center justify-between">
            <span className="text-sm text-green-700 dark:text-green-300 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Imported {importState.count} task{importState.count !== 1 ? "s" : ""} successfully!
            </span>
            <button
              type="button"
              onClick={() => setImportState({ step: "idle" })}
              className="text-xs text-green-600 dark:text-green-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error */}
        {importState.step === "error" && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
            <span className="text-sm text-red-700 dark:text-red-300">{importState.message}</span>
            <button
              type="button"
              onClick={() => setImportState({ step: "idle" })}
              className="text-xs text-red-600 dark:text-red-400 hover:underline ml-2 flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Supported platforms info */}
      <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
        <p className="font-medium text-slate-500 dark:text-slate-400">Supported import formats:</p>
        <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          <li>• Google Tasks (JSON)</li>
          <li>• Todoist (CSV)</li>
          <li>• Asana (CSV)</li>
          <li>• Notion (CSV)</li>
          <li>• Foci backup (JSON)</li>
          <li>• Any CSV with titles</li>
        </ul>
      </div>
    </div>
  );
}
