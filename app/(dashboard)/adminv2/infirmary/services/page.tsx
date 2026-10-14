"use client";

import React, { useEffect, useState } from "react";
import { HandHeart, Pencil, Plus } from "lucide-react";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

type Filter = "All" | "Available" | "Unavailable";

const FILTERS: Filter[] = ["All", "Available", "Unavailable"];

interface Service {
  id: number | string;
  name: string;
  description: string;
  is_available: boolean;
}

type FormValues = Pick<Service, "name" | "description" | "is_available">;

const serif = { fontFamily: "Georgia, serif" } as const;

const AVAILABLE_BADGE = "bg-[#7ed957] text-[#1f3d12]";
const UNAVAILABLE_BADGE = "bg-[#ff3b30] text-white";

// Filter buttons keep their own color (purple / green / red); the selected one gets the ring.
const FILTER_STYLES: Record<Filter, string> = {
  All: "bg-[#c48ab2] text-white",
  Available: AVAILABLE_BADGE,
  Unavailable: UNAVAILABLE_BADGE,
};
const FILTER_ACTIVE = "ring-2 ring-offset-2 ring-offset-[#FEEAEE] ring-[#39265f]/40";

// Alternating row looks (same palette as the Notifications list).
const ROW_DARK =
  "bg-gradient-to-r from-[#d9b8d0] to-[#e3c6da] border-2 border-[#39265f]/80";
const ROW_LIGHT =
  "bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] border border-[#d3bbcc]";

// --- Mock data (stand-in for a Supabase table named "services") ---
// Expected real columns: id, name, description, is_available
const buildMockServices = (): Service[] => [
  { id: 1, name: "Medical Consultation", description: "Assessment and basic care for common illnesses and health concerns.", is_available: true },
  { id: 2, name: "Vital Signs Check", description: "Checking blood pressure, temperature, pulse, and other basic vital signs.", is_available: true },
  { id: 3, name: "Dental Check-up", description: "Basic dental examination to check teeth and oral health.", is_available: true },
  { id: 4, name: "Medical Certificate", description: "Issuance of a certificate confirming a student's medical assessment or visit.", is_available: true },
  { id: 5, name: "Vaccination", description: "Administration of available vaccines for eligible students.", is_available: false },
  { id: 6, name: "Eye Examination", description: "Basic vision screening and eye health assessment.", is_available: false },
];

/* ------------------------------ Inline form ------------------------------ */

function ServiceForm({
  heading,
  initial,
  submitLabel,
  onSave,
  onCancel,
}: {
  heading: string;
  initial: FormValues;
  submitLabel: string;
  onSave: (values: FormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [isAvailable, setIsAvailable] = useState(initial.is_available);

  const canSave = name.trim() !== "";
  const field =
    "w-full px-3 py-2 rounded-lg bg-[#f4e1eb] border border-[#c48ab2] text-sm text-[#39265f] placeholder:text-[#5a4a75]/70 focus:outline-none focus:border-[#9b51e0]";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) onSave({ name: name.trim(), description: description.trim(), is_available: isAvailable });
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      className="flex flex-col gap-3 text-[#39265f]"
    >
      <h2 className="text-lg font-bold" style={serif}>
        {heading}
      </h2>

      <label className="flex flex-col gap-1 text-sm" style={serif}>
        Service name
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Medical Consultation"
          className={field}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={serif}>
        Description
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what this service covers..."
          className={`${field} resize-none`}
        />
      </label>

      <fieldset className="flex items-center gap-4 text-sm" style={serif}>
        <legend className="sr-only">Availability</legend>
        <span>Availability:</span>
        {[true, false].map((value) => (
          <label key={String(value)} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={isAvailable === value}
              onChange={() => setIsAvailable(value)}
              className="accent-[#39265f]"
            />
            {value ? "Available" : "Unavailable"}
          </label>
        ))}
      </fieldset>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition"
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="px-6 py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  // Which row is being edited inline; "new" means the add form at the top of the list.
  const [editingId, setEditingId] = useState<Service["id"] | "new" | null>(null);

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

  const visible = services.filter(
    (s) => filter === "All" || (filter === "Available") === s.is_available
  );

  // If a saved service no longer matches the active filter, go back to "All" so it doesn't vanish.
  const finishSave = (isAvailable: boolean) => {
    setEditingId(null);
    if (filter !== "All" && (filter === "Available") !== isAvailable) setFilter("All");
  };

  const handleAdd = (values: FormValues) => {
    // New services go to the top so they're visible right away.
    setServices((prev) => [{ id: Date.now(), ...values }, ...prev]);
    finishSave(values.is_available);
    // TODO (Supabase): const { data } = await supabase.from("services").insert(values).select().single(); use data.id
  };

  const handleEdit = (id: Service["id"], values: FormValues) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...values } : s)));
    finishSave(values.is_available);
    // TODO (Supabase): await supabase.from("services").update(values).eq("id", id);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 text-[#402A5D]">
            <HandHeart size={48} strokeWidth={1.5} />
            <div>
              <h1 className="text-5xl font-semibold tracking-wide" style={serif}>
                Services
              </h1>
              <p className="text-sm text-[#5a4a75] mt-1" style={serif}>
                View and manage available services
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-pressed={editingId === "new"}
            onClick={() => setEditingId((prev) => (prev === "new" ? null : "new"))}
            className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#e3c6da] border border-[#c48ab2] text-[#5a4a75] text-xs shadow-sm hover:brightness-95 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
          >
            <Plus size={22} strokeWidth={3} className="text-[#8a5a7e]" />
            Add new service...
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

        {/* Availability filter */}
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

        {/* Service list */}
        {loading ? (
          <p className="text-center text-[#5a4a75] py-8">Loading services...</p>
        ) : (
          <ul className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {editingId === "new" && (
              <li className={`p-4 rounded-xl ${ROW_DARK}`}>
                <ServiceForm
                  heading="New service"
                  initial={{ name: "", description: "", is_available: true }}
                  submitLabel="ADD SERVICE"
                  onSave={handleAdd}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            )}

            {visible.length === 0 && editingId !== "new" && (
              <li className="text-center text-[#5a4a75] py-8">
                {filter === "All"
                  ? "No services yet. Use \u201CAdd new service...\u201D to create one."
                  : `No ${filter.toLowerCase()} services.`}
              </li>
            )}

            {visible.map((service, i) => {
              const rowStyle = `${i % 2 === 0 ? ROW_DARK : ROW_LIGHT} shadow-[0_2px_4px_rgba(0,0,0,0.05)]`;

              if (editingId === service.id) {
                return (
                  <li key={service.id} className={`p-4 rounded-xl ${rowStyle}`}>
                    <ServiceForm
                      heading="Edit service"
                      initial={service}
                      submitLabel="SAVE"
                      onSave={(values) => handleEdit(service.id, values)}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                );
              }

              return (
                <li key={service.id} className={`flex items-center justify-between gap-4 p-4 rounded-xl ${rowStyle}`}>
                  <div className="flex items-center gap-5 min-w-0">
                    <div
                      aria-hidden="true"
                      className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] flex items-center justify-center shadow-inner"
                    >
                      <Plus size={28} strokeWidth={4} className="text-[#e2d5e3]" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-[#39265f]" style={serif}>
                        {service.name}
                      </h3>
                      <p className="text-sm text-[#5a4a75]" style={serif}>
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-md text-sm font-bold ${
                        service.is_available ? AVAILABLE_BADGE : UNAVAILABLE_BADGE
                      }`}
                    >
                      {service.is_available ? "Available" : "Unavailable"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${service.name}`}
                      onClick={() => setEditingId(service.id)}
                      className="p-1 rounded text-[#6d5b7a] hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
                    >
                      <Pencil size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
