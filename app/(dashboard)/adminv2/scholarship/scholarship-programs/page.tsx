"use client";

import { useSearchQuery, matchesQuery } from "@/lib/useSearchQuery";
import React, { useEffect, useState } from "react";
import { GraduationCap, Pencil, Plus } from "lucide-react";
import ProgramFormModal from "@/components/admin/scholarship/modals/ProgramFormModal";
import {
  fetchPrograms,
  saveProgram,
  type Program,
  type ProgramValues,
} from "@/lib/adminscholarshipApi";

type Filter = "All" | "Active" | "Inactive";

const FILTERS: Filter[] = ["All", "Active", "Inactive"];

// Which modal is open: the add form, or the edit form for one program.
type ModalState = { mode: "add" } | { mode: "edit"; id: Program["id"] } | null;

const serif = { fontFamily: "Georgia, serif" } as const;

const ACTIVE_BADGE = "bg-[#7ed957] text-[#1f3d12]";
const INACTIVE_BADGE = "bg-[#ff3b30] text-white";

// Filter buttons keep their own color (purple / green / red); the selected one gets the ring.
const FILTER_STYLES: Record<Filter, string> = {
  All: "bg-[#c48ab2] text-white",
  Active: ACTIVE_BADGE,
  Inactive: INACTIVE_BADGE,
};
const FILTER_ACTIVE = "ring-2 ring-offset-2 ring-offset-[#FEEAEE] ring-[#39265f]/40";

// Alternating row looks (same palette as the Notifications list).
const ROW_DARK = "bg-gradient-to-r from-[#d9b8d0] to-[#e3c6da] border-2 border-[#39265f]/80";
const ROW_LIGHT = "bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] border border-[#d3bbcc]";

export default function ScholarshipProgramsPage() {
  const q = useSearchQuery();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setPrograms(await fetchPrograms());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load programs.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visible = programs.filter(
    (p) =>
      (filter === "All" || (filter === "Active") === p.is_active) &&
      matchesQuery(q, p.name, p.description)
  );

  const editing = modal?.mode === "edit" ? programs.find((p) => p.id === modal.id) ?? null : null;

  // If a saved program no longer matches the active filter, go back to "All" so it doesn't vanish.
  const finishSave = (isActive: boolean) => {
    setModal(null);
    if (filter !== "All" && (filter === "Active") !== isActive) setFilter("All");
  };

  const handleSubmit = async (values: ProgramValues) => {
    try {
      if (modal?.mode === "edit") {
        const saved = await saveProgram(values, modal.id as string);
        setPrograms((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      } else {
        const saved = await saveProgram(values);
        // New programs go to the top so they're visible right away.
        setPrograms((prev) => [saved, ...prev]);
      }
      setError(null);
      finishSave(values.is_active);
    } catch (e) {
      // The form stays open; the message shows above the list.
      setError(e instanceof Error ? e.message : "Could not save the program.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 text-[#402A5D]">
            <GraduationCap size={48} strokeWidth={1.5} />
            <div>
              <h1 className="text-5xl font-semibold tracking-wide" style={serif}>
                Programs
              </h1>
              <p className="text-sm text-[#5a4a75] mt-1" style={serif}>
                View and manage available scholarship programs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setModal({ mode: "add" });
            }}
            className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#e3c6da] border border-[#c48ab2] text-[#5a4a75] text-xs shadow-sm hover:brightness-95 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
          >
            <Plus size={22} strokeWidth={3} className="text-[#8a5a7e]" />
            Add new program...
          </button>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full" />
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]" />
            <span className="w-4 h-2 rounded-full bg-[#39265f]" />
            <span className="w-2 h-2 rounded-full bg-[#39265f]" />
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full" />
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-[#ff2d2d] px-4 py-2 text-sm font-bold text-white">
            {error}
          </p>
        )}

        {/* Status filter */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`py-1.5 rounded-lg text-sm font-bold shadow-sm transition active:scale-95 ${FILTER_STYLES[f]} ${
                filter === f ? FILTER_ACTIVE : "opacity-75 hover:opacity-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Program list */}
        {loading ? (
          <p className="text-center text-[#5a4a75] py-8">Loading programs...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-[#5a4a75] py-8">
            {filter === "All"
              ? "No programs yet. Use \u201CAdd new program...\u201D to create one."
              : `No ${filter.toLowerCase()} programs.`}
          </p>
        ) : (
          <ul className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {visible.map((program, i) => (
              <li
                key={program.id}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${
                  i % 2 === 0 ? ROW_DARK : ROW_LIGHT
                }`}
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div
                    aria-hidden="true"
                    className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] flex items-center justify-center shadow-inner"
                  >
                    <GraduationCap size={22} className="text-[#e2d5e3]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#39265f]" style={serif}>
                      {program.name}
                    </h3>
                    <p className="text-sm text-[#5a4a75]" style={serif}>
                      {program.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-md text-sm font-bold ${
                      program.is_active ? ACTIVE_BADGE : INACTIVE_BADGE
                    }`}
                  >
                    {program.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    aria-label={`Edit ${program.name}`}
                    onClick={() => {
                      setError(null);
                      setModal({ mode: "edit", id: program.id });
                    }}
                    className="p-1 rounded text-[#6d5b7a] hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
                  >
                    <Pencil size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal?.mode === "add" && (
        <ProgramFormModal mode="add" onCancel={() => setModal(null)} onSubmit={handleSubmit} />
      )}
      {modal?.mode === "edit" && editing && (
        <ProgramFormModal
          key={editing.id}
          mode="edit"
          initial={editing}
          onCancel={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}