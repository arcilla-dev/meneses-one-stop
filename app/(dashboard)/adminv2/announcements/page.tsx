"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  FileText,
  FileSignature,
  GraduationCap,
  PlusSquare,
  Users,
  Search,
  ChevronDown,
  Pencil,
  Trash,
  X,
} from "lucide-react";
import {
  DEFAULT_OFFICE,
  EDIT_WINDOW_MS,
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchMyOffice,
  updateAnnouncement,
  type AnnouncementItem,
} from "@/lib/announcementsApi";

type SortOption = "Most recent" | "Oldest";
const SORT_OPTIONS: SortOption[] = ["Most recent", "Oldest"];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "general", label: "General" },
  { value: "enrollment", label: "Enrollment" },
  { value: "infirmary", label: "Infirmary" },
  { value: "scholarship", label: "Scholarship" },
  { value: "printing", label: "Printing" },
];

// Maps announcement_type to a lucide icon (same pattern as the student announcements page).
const ICON_MAP: Record<string, React.ElementType> = {
  enrollment: FileSignature,
  infirmary: PlusSquare,
  scholarship: GraduationCap,
  printing: Users,
};

const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

// Shared control colors (same palette as notifications/page.tsx)
const CONTROL_IDLE = "bg-[#D8ABCA] text-white";
const CONTROL_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const FIELD_CLASS =
  "w-full px-4 py-3 rounded-xl bg-[#f4e1eb] border border-[#d3bbcc] text-[#39265f] placeholder:text-[#5a4a75]/70 focus:outline-none focus:border-[#9b51e0]";

const timeAgo = (iso: string, now: number) => {
  const minutes = Math.floor(Math.max(0, now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const isEditable = (item: AnnouncementItem, now: number) =>
  now - new Date(item.created_at).getTime() < EDIT_WINDOW_MS;

type EditorState = { mode: "create" } | { mode: "edit"; item: AnnouncementItem } | null;

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [office, setOffice] = useState(DEFAULT_OFFICE); // the signed-in admin's office (profiles.office)
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<SortOption>("Most recent");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<AnnouncementItem["id"] | null>(null);

  // Ticks so relative times and the 1-hour edit window stay current while the page is open.
  const [now, setNow] = useState(() => Date.now());

  // Create / edit dialog
  const [editor, setEditor] = useState<EditorState>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [draftType, setDraftType] = useState("general");
  const [formError, setFormError] = useState("");

  // Delete confirmation dialog
  const [pendingDelete, setPendingDelete] = useState<AnnouncementItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [list, myOffice] = await Promise.all([fetchAnnouncements(), fetchMyOffice()]);
      setAnnouncements(list);
      setOffice(myOffice);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Close whichever dialog is open with Escape.
  useEffect(() => {
    if (!editor && !pendingDelete) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditor(null);
        setPendingDelete(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, pendingDelete]);

  const visibleAnnouncements = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = announcements.filter(
      (a) => q === "" || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q)
    );
    return [...matches].sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === "Most recent" ? diff : -diff;
    });
  }, [announcements, query, sort]);

  const openCreate = () => {
    setDraftTitle("");
    setDraftMessage("");
    setDraftType("general");
    setFormError("");
    setEditor({ mode: "create" });
  };

  const openEdit = (item: AnnouncementItem) => {
    setDraftTitle(item.title);
    setDraftMessage(item.message);
    setDraftType(item.announcement_type);
    setFormError("");
    setEditor({ mode: "edit", item });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || saving) return;

    const title = draftTitle.trim();
    const message = draftMessage.trim();
    if (title === "" || message === "") {
      setFormError("Add a title and a message before posting.");
      return;
    }

    // Re-check the window at save time in case the dialog was left open past the deadline.
    // The database enforces it too (RLS), so this is only for a faster, clearer message.
    if (editor.mode === "edit" && !isEditable(editor.item, Date.now())) {
      setFormError("The 1-hour edit window for this announcement has ended.");
      setNow(Date.now());
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editor.mode === "create") {
        const created = await createAnnouncement({ title, message, announcement_type: draftType });
        setAnnouncements((prev) => [created, ...prev]);
      } else {
        const updated = await updateAnnouncement(editor.item.id, {
          title,
          message,
          announcement_type: draftType,
        });
        setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      }
      setNow(Date.now());
      setEditor(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save the announcement.");
      // A missed edit usually means the window closed or it was deleted elsewhere: resync the list.
      if (editor.mode === "edit") loadAnnouncements();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    const id = pendingDelete.id;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      if (expandedId === id) setExpandedId(null);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete the announcement.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[#402A5D]">
            <Megaphone size={48} strokeWidth={1.5} className="fill-[#402A5D] text-[#402A5D]" />
            <div>
              <h1 className="text-5xl font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
                Announcements
              </h1>
              <p className="text-sm text-[#5a4a75] mt-1" style={{ fontFamily: "Georgia, serif" }}>
                Manage announcements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f4e1eb] border border-[#d3bbcc] text-[#39265f] text-sm font-bold shadow-sm transition-transform hover:scale-105 hover:border-[#9b51e0] active:scale-95"
          >
            <Megaphone size={18} />
            Make new announcement
          </button>
        </div>

        {/* Decorative Divider (same as notifications) */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-4 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
        </div>

        {/* Sort dropdown + Search toggle */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative">
            <select
              aria-label="Sort announcements"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={`appearance-none cursor-pointer py-2 pl-5 pr-12 rounded-lg font-bold text-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39265f]/40 ${CONTROL_ACTIVE}`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-[#39265f] bg-[#f4e1eb]">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={22}
              strokeWidth={3}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#39265f]"
            />
          </div>

          <button
            type="button"
            aria-label="Search announcements"
            aria-pressed={showSearch}
            onClick={() => {
              setShowSearch((prev) => !prev);
              if (showSearch) setQuery("");
            }}
            className={`shrink-0 w-14 h-10 flex items-center justify-center rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 ${
              showSearch ? CONTROL_ACTIVE : CONTROL_IDLE
            }`}
          >
            <Search size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search input (revealed by the search button) */}
        {showSearch && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements..."
            autoFocus
            className={`mb-4 ${FIELD_CLASS}`}
          />
        )}

        {/* Thin rule between controls and list */}
        <div className="h-px bg-[#39265f]/40 mb-4 mx-4" />

        {/* List Section */}
        {loading ? (
          <p className="text-center text-[#5a4a75] py-8">Loading announcements...</p>
        ) : loadError ? (
          <div role="alert" className="text-center py-8">
            <p className="text-sm font-bold text-[#b3202a]">{loadError}</p>
            <button
              type="button"
              onClick={loadAnnouncements}
              className="mt-3 px-4 py-2 rounded-lg bg-[#D8ABCA] text-white text-sm font-bold shadow-sm hover:brightness-105 active:scale-95 transition"
            >
              Try again
            </button>
          </div>
        ) : visibleAnnouncements.length === 0 ? (
          <p className="text-center text-[#5a4a75] py-8">
            {query.trim() !== ""
              ? "No announcements match your search."
              : "No announcements yet. Use “Make new announcement” to post the first one."}
          </p>
        ) : (
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {visibleAnnouncements.map((item) => {
              const Icon = getIconForType(item.announcement_type);
              const isExpanded = expandedId === item.id;
              const editable = isEditable(item, now);
              return (
                <div key={item.id} className="flex items-stretch gap-1">
                  {/* Announcement card */}
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-4 p-4 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-colors duration-200 hover:border-[#9b51e0] bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] border border-[#d3bbcc]">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className={`flex-1 min-w-0 text-left flex gap-5 cursor-pointer ${
                        isExpanded ? "items-start" : "items-center"
                      }`}
                    >
                      <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] flex items-center justify-center shadow-inner">
                        <Icon size={28} className="text-[#e2d5e3]" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h3
                          className={`text-[1.15rem] font-bold text-[#39265f] mb-0.5 ${isExpanded ? "" : "truncate"}`}
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {item.title}
                        </h3>
                        <p className={`text-sm text-[#5a4a75] ${isExpanded ? "" : "truncate"}`}>{item.message}</p>
                        {isExpanded && (
                          <p className="text-sm font-bold text-[#39265f] mt-2">From: {item.office}</p>
                        )}
                      </div>
                    </button>

                    {/* Right side: edit (only inside the 1-hour window) + relative time */}
                    <div className={`shrink-0 flex items-center gap-2 text-[#39265f] ${isExpanded ? "self-start" : ""}`}>
                      {editable && (
                        <button
                          type="button"
                          aria-label={`Edit announcement: ${item.title}`}
                          onClick={() => openEdit(item)}
                          className="p-1 rounded-md text-[#6d3f66] transition-transform hover:scale-110 hover:text-[#39265f] active:scale-95"
                        >
                          <Pencil size={18} strokeWidth={2.5} />
                        </button>
                      )}
                      <span className="text-sm font-bold">{timeAgo(item.created_at, now)}</span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    aria-label={`Delete announcement: ${item.title}`}
                    onClick={() => {
                      setDeleteError("");
                      setPendingDelete(item);
                    }}
                    className="shrink-0 w-11 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] border border-[#d3bbcc] text-[#6d3f66] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-colors hover:border-[#9b51e0] hover:text-[#39265f] active:scale-95"
                  >
                    <Trash size={22} strokeWidth={2} className="fill-[#FEEAEE] text-[#402A5D]"/>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit-window note */}
        <p className="mt-4 text-right text-sm font-bold text-[#39265f]">// edits are available for 1 hour only</p>
      </div>

      {/* Create / edit dialog */}
      {editor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#39265f]/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditor(null);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-dialog-title"
            onSubmit={handleSave}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-[#FEEAEE] border border-[#d3bbcc] shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2
                id="announcement-dialog-title"
                className="text-3xl font-semibold text-[#402A5D]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {editor.mode === "create" ? "Make new announcement" : "Edit announcement"}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditor(null)}
                className="p-1 rounded-md text-[#39265f] hover:bg-[#d8abca]/50"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm font-bold text-[#39265f]">
                Title
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Enrollment Schedule for 2nd Semester"
                  autoFocus
                  className={`font-normal ${FIELD_CLASS}`}
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-bold text-[#39265f]">
                Category
                <div className="relative">
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className={`appearance-none cursor-pointer pr-12 font-normal ${FIELD_CLASS}`}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={20}
                    strokeWidth={3}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#39265f]"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1 text-sm font-bold text-[#39265f]">
                Message
                <textarea
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  placeholder="Write the announcement students will see."
                  className={`resize-y font-normal ${FIELD_CLASS}`}
                />
              </label>

              <p className="text-sm text-[#5a4a75]">
                Posting as <span className="font-bold text-[#39265f]">{office}</span>.
                {editor.mode === "create" && " You can edit it for 1 hour after posting."}
              </p>

              {formError && (
                <p role="alert" className="text-sm font-bold text-[#b3202a]">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="px-5 py-3 rounded-xl font-bold bg-[#D8ABCA] text-white shadow-sm hover:brightness-105 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 rounded-xl font-bold text-white bg-[#39265f] shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? editor.mode === "create"
                    ? "Posting..."
                    : "Saving..."
                  : editor.mode === "create"
                  ? "Post announcement"
                  : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#39265f]/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingDelete(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md p-6 rounded-2xl bg-[#FEEAEE] border border-[#d3bbcc] shadow-xl"
          >
            <h2
              id="delete-dialog-title"
              className="text-2xl font-semibold text-[#402A5D]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Delete this announcement?
            </h2>
            <p className="mt-2 text-[#5a4a75]">
              “{pendingDelete.title}” will be removed for all students. This can’t be undone.
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 text-sm font-bold text-[#b3202a]">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                autoFocus
                className="px-5 py-3 rounded-xl font-bold bg-[#D8ABCA] text-white shadow-sm hover:brightness-105 active:scale-95 transition"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-3 rounded-xl font-bold text-white bg-[#b3202a] shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
