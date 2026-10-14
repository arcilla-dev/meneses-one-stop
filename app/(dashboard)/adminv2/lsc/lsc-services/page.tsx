"use client";

import React, { useEffect, useMemo, useState } from "react";
import { GraduationCap, HandHelping, Pencil, Plus } from "lucide-react";
import ServiceFormModal, {
  type ServiceFormValues,
} from "@/components/admin/lsc/modals/ServiceFormModal";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

type FilterTab = "All" | "Active" | "Inactive";

interface Service {
  id: number | string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string; // ISO timestamp (used for ordering)
}

type ModalState = { mode: "add" } | { mode: "edit"; id: Service["id"] } | null;

const serif = { fontFamily: "Georgia, serif" } as const;

const TABS: Array<{ key: FilterTab; look: string }> = [
  { key: "All", look: "bg-[#C48AB2] text-white" },
  { key: "Active", look: "bg-[#7ed957] text-[#1f3d12]" },
  { key: "Inactive", look: "bg-[#ff3b30] text-white" },
];
const TAB_SELECTED_RING = "ring-2 ring-offset-2 ring-[#39265f]/40";

// --- Mock data (stand-in for a Supabase table named "services") ---
// Expected real columns: id, name, description, is_active, created_at
// The three inactive names are placeholders; the wireframe only shows blank lines for them.
const buildMockServices = (): Service[] =>
  [
    {
      name: "Printing Service",
      description: "Turning your digital files and documents into high-quality paper copies",
      is_active: true,
    },
    {
      name: "Scanning Service",
      description: "Converting your physical papers and photos into secure digital files",
      is_active: true,
    },
    {
      name: "Photocopy Service",
      description: "Making instant, accurate paper duplicates of your original documents",
      is_active: true,
    },
    { name: "Laminating Service", description: "Protecting your documents and IDs with a durable plastic seal", is_active: false },
    { name: "Document Binding", description: "Binding thesis and project papers into finished copies", is_active: false },
    { name: "ID Photo Service", description: "Taking and printing photos for student and application IDs", is_active: false },
  ].map((s, i) => ({
    ...s,
    id: i + 1,
    created_at: new Date(2026, 0, 1 + i).toISOString(),
  }));

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const { data, error } = await supabase
      //   .from("services")
      //   .select("*")
      //   .order("created_at", { ascending: true });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setServices(data as Service[]);
      // }

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 200));
      setServices(buildMockServices());

      setLoading(false);
    };

    loadServices();
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

  const handleSave = (values: ServiceFormValues) => {
    if (modal?.mode === "edit" && editing) {
      setServices((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...values } : s)));
      // TODO (Supabase): await supabase.from("services").update(values).eq("id", editing.id);
    } else {
      // TODO (Supabase): insert, then use the returned row (and its real id) instead of this temporary one.
      const created: Service = {
        ...values,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setServices((prev) => [...prev, created]);
    }
    setModal(null);
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
            onClick={() => setModal({ mode: "add" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d8abca] text-[#39265f] text-xs font-bold shadow-sm hover:brightness-105 active:scale-95 transition"
          >
            <Plus size={16} aria-hidden="true" />
            Add new service...
          </button>
        </div>

        <div className="h-[2px] mt-3 bg-[#39265f]/40 rounded-full" />

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
                  onClick={() => setModal({ mode: "edit", id: service.id })}
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
