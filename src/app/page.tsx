"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, KanbanSquare, ListTree, Tag, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Status = "To Be Started" | "In Progress" | "Done";
type Project = {
  id: string;
  title: string;
  status: Status;
  tags: string[];
  notes?: string;
  createdAt: string; // ISO
};

// Map between UI status labels and DB enum values
type DbStatus = "TO_BE_STARTED" | "IN_PROGRESS" | "DONE";
const uiToDb = (s: Status): DbStatus =>
  s === "To Be Started" ? "TO_BE_STARTED" : s === "In Progress" ? "IN_PROGRESS" : "DONE";
const dbToUi = (s: DbStatus): Status =>
  s === "TO_BE_STARTED" ? "To Be Started" : s === "IN_PROGRESS" ? "In Progress" : "Done";

const STATUS_ORDER: Status[] = ["To Be Started", "In Progress", "Done"];
const STATUS_SHORTCUTS: Record<string, Status> = {
  "1": "To Be Started",
  "2": "In Progress",
  "3": "Done",
};

const SUGGESTED_TAGS = [
  "Side Project",
  "Portfolio",
  "Upwork",
  "Client",
  "Automation",
  "Learning",
  "Design",
  "Backend",
];

const uid = () => Math.random().toString(36).slice(2, 9);
const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");



// ---------- New / Edit dialog
function ProjectDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<Project>;
  onSubmit: (p: Project) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState<Status>((initial?.status as Status) ?? "To Be Started");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setStatus((initial?.status as Status) ?? "To Be Started");
    setTags(initial?.tags ?? []);
    setNotes(initial?.notes ?? "");
    setTagInput("");
  }, [initial, open]);

  // Add keyboard shortcuts for status selection when dialog is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (["1", "2", "3"].includes(e.key)) {
        setStatus(STATUS_ORDER[parseInt(e.key) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const addTag = (t: string) => {
    const v = t.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleEnterTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const submit = () => {
    if (!title.trim()) return;
    const project: Project = {
      id: (initial?.id as string) ?? uid(),
      title: title.trim(),
      status,
      tags,
      notes: notes.trim() || undefined,
      createdAt: (initial?.createdAt as string) ?? new Date().toISOString(),
    };
    onSubmit(project);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription>Quickly jot the idea, tag it, set status, write a note.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Build scraper for quote cleanup"
              className="mt-1"
              autoFocus
            />
          </div>

          {/* Status DropdownMenu with keyboard shortcuts */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-2 rounded-full w-full justify-between">
                  {status}
                  <span className="text-xs text-muted-foreground ml-2">(1 / 2 / 3)</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {STATUS_ORDER.map((s, i) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => setStatus(s)}
                    className={status === s ? "bg-gray-100 font-medium" : ""}
                  >
                    <kbd className="text-xs text-muted-foreground mr-2">{i + 1}</kbd> {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full text-sm">
                  <span className="mr-2">{t}</span>
                  <button onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleEnterTag}
                placeholder="Type a tag and press Enter"
              />
              <Button variant="secondary" onClick={() => addTag(tagInput)}>Add</Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((t) => (
                <Button key={t} size="sm" variant="outline" className="rounded-full" onClick={() => addTag(t)}>
                  <Tag className="mr-2 h-4 w-4" /> {t}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context, links, sub-tasks, next steps…"
              className="mt-1 min-h-[120px]"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{initial?.id ? "Save" : "Create"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectTracker() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Project | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rowRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [newTag, setNewTag] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      // Map DB -> UI
      const normalized: Project[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        status: dbToUi(row.status as DbStatus),
        tags: row.tags ?? [],
        notes: row.notes ?? undefined,
        createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
      }));
      setProjects(normalized);
    })();
  }, []);

  // Helper to persist a single project to the API
  async function persistProject(p: Project) {
    const payload = {
      ...p,
      status: uiToDb(p.status),
      createdAt: p.createdAt,
    };
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // API-backed upsert
  const upsert = async (proj: Project) => {
    const exists = projects.some((p) => p.id === proj.id);
    if (exists) {
      // optimistic update
      setProjects((prev) => prev.map((p) => (p.id === proj.id ? proj : p)));
      await persistProject(proj);
    } else {
      // create
      const payload = { ...proj, status: uiToDb(proj.status) };
      // optimistic add
      setProjects((prev) => [proj, ...prev]);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // optional: sync back DB fields (e.g., server-generated id)
      try {
        const saved = await res.json();
        if (saved?.id && saved.id !== proj.id) {
          setProjects((prev) => prev.map((p) => (p.id === proj.id ? { ...p, id: saved.id } : p)));
        }
      } catch {}
    }
  };

  // API-backed remove
  const remove = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id)); // optimistic
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  // General update helper to merge partial edits and persist
  const updateProject = async (id: string, patch: Partial<Project>) => {
    let next: Project | null = null;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        next = { ...p, ...patch };
        return next;
      })
    );
    if (next) await persistProject(next);
  };

  const allTags = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.notes?.toLowerCase().includes(q) ?? false) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !selectedTag || p.tags.includes(selectedTag);
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesQuery && matchesTag && matchesStatus;
    });
  }, [projects, search, selectedTag, statusFilter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (["INPUT", "TEXTAREA"].includes(target.tagName) ||
          (target.getAttribute("contenteditable") === "true"));
      if (isTyping) return;

      // Create a stable snapshot of the current filtered list
      const items = filtered;

      // Navigate selection with ArrowUp / ArrowDown
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (items.length === 0) return;

        const idx = selectedId ? items.findIndex((p) => p.id === selectedId) : -1;
        let nextIdx = idx;

        if (e.key === "ArrowDown") {
          nextIdx = idx < items.length - 1 ? idx + 1 : 0; // wrap to top
        } else if (e.key === "ArrowUp") {
          nextIdx = idx > 0 ? idx - 1 : items.length - 1; // wrap to bottom
        }

        const next = items[nextIdx];
        if (next) {
          setSelectedId(next.id);
          // scroll into view smoothly
          const el = rowRefs.current[next.id];
          if (el && "scrollIntoView" in el) {
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }
        return;
      }

      // New item
      if (e.key.toLowerCase() === "n") {
        setEdit(undefined);
        setDialogOpen(true);
        return;
      }

      // Set status (1/2/3) on selected item
      if (selectedId && STATUS_SHORTCUTS[e.key]) {
        const nextStatus = STATUS_SHORTCUTS[e.key];
        updateProject(selectedId, { status: nextStatus });
        return;
      }

      // Delete selected with 'd'
      if (selectedId && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        remove(selectedId);
        setSelectedId(null);
        return;
      }

      // Clear selection / close
      if (e.key === "Escape") {
        setSelectedId(null);
        setDialogOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, filtered]);

  const openNew = () => {
    setEdit(undefined);
    setDialogOpen(true);
  };


  const SectionHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button onClick={openNew} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> New (N)
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, notes, tags"
            className="pl-9 w-64 rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setStatusFilter("All")}>
              {statusFilter === "All" ? "✓ " : ""}All
            </DropdownMenuItem>
            {STATUS_ORDER.map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                {statusFilter === s ? "✓ " : ""}
                {s}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Tag</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSelectedTag(null)}>
              {!selectedTag ? "✓ " : ""}Any tag
            </DropdownMenuItem>
            {allTags.map((t) => (
              <DropdownMenuItem key={t} onClick={() => setSelectedTag(t)}>
                {selectedTag === t ? "✓ " : ""}
                {t}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Toggle
          pressed={view === "list"}
          onPressedChange={() => setView(view === "list" ? "kanban" : "list")}
          className="rounded-full px-4"
        >
          {view === "list" ? (
            <span className="flex items-center gap-2"><KanbanSquare className="h-4 w-4" /> Kanban</span>
          ) : (
            <span className="flex items-center gap-2"><ListTree className="h-4 w-4" /> List</span>
          )}
        </Toggle>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Project Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            {SectionHeader}
          </CardContent>
        </Card>

        {view === "list" ? (
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="grid grid-cols-12 px-4 py-2 text-sm text-muted-foreground">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Tags</div>
                  <div className="col-span-2 text-right pr-2">Actions</div>
                </div>
                {filtered.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">No projects yet. Press N to add one.</div>
                )}
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    ref={(el) => (rowRefs.current[p.id] = el)}
                    className={cls(
                      "grid grid-cols-12 items-center px-4 py-3 transition",
                      selectedId === p.id ? "bg-gray-100" : "hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <div className="col-span-5">
                      {editingId === p.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                await updateProject(p.id, { title: editingTitle.trim() || p.title });
                                setEditingId(null);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            onBlur={async () => {
                              await updateProject(p.id, { title: editingTitle.trim() || p.title });
                              setEditingId(null);
                            }}
                          />
                          <Textarea
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder="Notes…"
                            className="min-h-[80px]"
                            onKeyDown={async (e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                await updateProject(p.id, { notes: editingNotes.trim() || undefined });
                                setEditingId(null);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            onBlur={async () => {
                              await updateProject(p.id, { notes: editingNotes.trim() || undefined });
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <div
                            className="font-medium cursor-text"
                            onDoubleClick={() => {
                              setEditingId(p.id);
                              setEditingTitle(p.title);
                              setEditingNotes(p.notes ?? "");
                            }}
                          >
                            {p.title}
                          </div>
                          {p.notes && (
                            <div
                              className="line-clamp-1 text-sm text-muted-foreground cursor-text"
                              onDoubleClick={() => {
                                setEditingId(p.id);
                                setEditingTitle(p.title);
                                setEditingNotes(p.notes ?? "");
                              }}
                            >
                              {p.notes}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="col-span-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cls(
                              "rounded-full text-xs px-3 py-1 font-medium",
                              p.status === "Done"
                                ? "bg-emerald-100 text-emerald-700"
                                : p.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-200 text-gray-700"
                            )}
                          >
                            {p.status}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-36">
                          {STATUS_ORDER.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => updateProject(p.id, { status: s })}
                              className={p.status === s ? "bg-gray-100 font-medium" : ""}
                            >
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="col-span-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="rounded-full">
                            <span className="mr-1">{t}</span>
                            {selectedId === p.id && (
                              <button
                                className="ml-1"
                                aria-label={`Remove ${t}`}
                                onClick={() => updateProject(p.id, { tags: p.tags.filter((tt) => tt !== t) })}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                        {selectedId === p.id && (
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                const v = newTag.trim();
                                if (v && !p.tags.includes(v)) {
                                  updateProject(p.id, { tags: [...p.tags, v] });
                                }
                                setNewTag("");
                              }
                            }}
                            placeholder="+ tag"
                            className="h-7 w-28 rounded-full text-xs"
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      {/* Hint text when selected to edit inline */}
                      {selectedId === p.id && editingId !== p.id && (
                        <span className="text-xs text-muted-foreground">Double‑click title/notes to edit</span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full px-2"
                        aria-label="Delete"
                        onClick={() => remove(p.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STATUS_ORDER.map((col) => (
              <Card key={col} className="rounded-2xl border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">{col}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filtered.filter((p) => p.status === col).length === 0 && (
                    <div className="text-sm text-muted-foreground">No items</div>
                  )}
                  {filtered
                    .filter((p) => p.status === col)
                    .map((p) => (
                      <div
                        key={p.id}
                        ref={(el) => (rowRefs.current[p.id] = el)}
                        className={cls(
                          "rounded-2xl border bg-white p-3 shadow-sm transition",
                          selectedId === p.id ? "ring-2 ring-black" : "hover:shadow"
                        )}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="font-medium">{p.title}</div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="rounded-full px-2">•••</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEdit(p); setDialogOpen(true); }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => remove(p.id)}>Delete</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {STATUS_ORDER.map((s) => (
                                <DropdownMenuItem key={s} onClick={() => updateProject(p.id, { status: s })}>
                                  Move to: {s}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {p.notes && (
                          <div className="mb-2 line-clamp-3 text-sm text-muted-foreground">{p.notes}</div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {p.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="rounded-full">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={edit}
        onSubmit={upsert}
      />

      <div className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/90 px-4 py-2 text-xs text-white shadow-lg">
        <span className="mr-3 opacity-80">Shortcuts:</span>
        <kbd className="rounded bg-white/20 px-1">N</kbd> New •
        <span className="mx-1" />
        <kbd className="rounded bg-white/20 px-1">1</kbd>/<kbd className="rounded bg-white/20 px-1">2</kbd>/<kbd className="rounded bg-white/20 px-1">3</kbd> Set status on selected •
        <span className="mx-1" />
        <kbd className="rounded bg-white/20 px-1">Esc</kbd> Clear
      </div>
    </div>
  );
}