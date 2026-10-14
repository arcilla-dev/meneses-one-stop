"use client";

import React, { useEffect, useMemo, useState } from "react";
import { GraduationCap, HandHelping, Pencil, Plus } from "lucide-react";
import ServiceFormModal, {
  type ServiceFormValues,
} from "@/components/admin/lsc/modals/ServiceFormModal";
import { fetchLscServices, saveLscService, type LscService } from "@/lib/adminlscApi";

type FilterTab = "All" | "Active" | "Inactive";

type ModalState = { mode: "add" } | { mode: "edit"; id: LscService["id"] } | null;

const serif = { fontFamily: "Georgia, serif" } as const;

const TABS: Array<{ key: FilterTab; look: string }> = [
  { key: "All", look: "bg-[#C48AB2] text-white" },
  { key: "Active", look: "bg-[#7ed957] text-[#1f3d12]" },
  { key: "Inactive", look: "bg-[#ff3b30] text-white" },
];
const TAB_SELECTED_RING = "ring-2 ring-offset-2 ring-[#39265f]/40";

export default function ServicesPage() {
  const [services, setServices] = useState<LscService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setServices(await fetchLscServices());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load services.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Active services first (as in the wireframe), otherwise original order. Array.sort is stable.
  const visible = useMemo(() => {
    const filtered = services.filter(
      (s) => filter === "All" || (filter === "Active" ? s.is_active : !s.is_active)
    );
    return [...filtered].sort((a, b) => Number(b.is_active) - Number(a.is_active));
  }, [services, filter]);

  const editing = modal?.mode === "edit" ? services.find((s) => s.id === modal.id) ?? null : null;

  // Names of every other service, so the form can reject duplicates.
  const takenNames = useMemo(
    () =>
      services
        .filter((s) => s.id !== editing?.id)
        .map((s) => s.name.trim().toLowerCase()),
    [services, editing]
  );

  const handleSave = async (values: ServiceFormValues) => {
    try {
      if (modal?.mode === "edit" && editing) {
        const saved = await saveLscService(values, editing.id);
        setServices((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      } else {
        const saved = await saveLscService(values);
        setServices((prev) => [...prev, saved]);
      }
      setError(null);
      setModal(null);
    } catch (e) {
      // The form stays open; the message shows above the list.
      setError(e instanceof Error ? e.message : "Could not save the service.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-6xl mx-auto rounded-2xl bg-[#f9d4e4] p-4 md:p-6 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <HandHelping aria-hidden="true" size={44} strokeWidth={1.5} className="text-[#39265f]" />
            <div>
              <h1 className="text-3xl font-bold leading-tight text-[#39265f]" style={serif}>
                Services
              </h1>
              <p className="text-sm text-[#39265f]" style={serif}>
                View and manage available services
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setModal({ mode: "add" });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d8abca] text-[#39265f] text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition"
          >
            <Plus size={16} aria-hidden="true" />
            Add new service...
          </button>
        </div>

        <div className="h-[2px] mt-3 bg-[#39265f]/40 rounded-full" />

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-[#ff2d2d] px-4 py-2 text-sm font-bold text-white">
            {error}
          </p>
        )}

        {/* Status filter */}
        <div className="flex flex-wrap justify-center gap-3 my-5">
          {TABS.map(({ key, look }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`min-w-[120px] px-5 py-1.5 rounded-md text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${look} ${
                filter === key ? TAB_SELECTED_RING : ""
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Service list */}
        {loading ? (
          <p className="text-center text-[#5a4a75] py-8">Loading services...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-[#5a4a75] py-8">No services found for this filter.</p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-[60vh] overflow-auto pr-1">
            {visible.map((service) => (
              <li
                key={service.id}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg border text-[#39265f] ${
                  service.is_active
                    ? "bg-[#e3bdd5] border-[#39265f]/60"
                    : "bg-[#f4e1eb] border-[#c48ab2]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] text-white"
                >
                  <GraduationCap size={24} />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold leading-tight truncate" style={serif}>
                    {service.name}
                  </h2>
                  <p className="text-xs leading-snug line-clamp-2" style={serif}>
                    {service.description}
                  </p>
                </div>

                <span
                  className={`shrink-0 min-w-[84px] px-3 py-1 rounded-md text-center text-xs font-bold ${
                    service.is_active ? "bg-[#7ed957] text-[#1f3d12]" : "bg-[#ff3b30] text-white"
                  }`}
                >
                  {service.is_active ? "Active" : "Inactive"}
                </span>

                <button
                  type="button"
                  aria-label={`Edit ${service.name}`}
                  onClick={() => {
                    setError(null);
                    setModal({ mode: "edit", id: service.id });
                  }}
                  className="shrink-0 p-1.5 rounded text-[#6d3d6a] hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (modal.mode === "add" || editing) && (
        <ServiceFormModal
          key={editing?.id ?? "new"}
          mode={modal.mode}
          initial={
            editing
              ? { name: editing.name, description: editing.description, is_active: editing.is_active }
              : undefined
          }
          takenNames={takenNames}
          onCancel={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}