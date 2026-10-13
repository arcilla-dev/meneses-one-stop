"use client";

import React, { useState } from "react";
import { ModalShell, textBox } from "@/components/admin/DecisionModals";
import { serif } from "@/components/admin/RequestModal";

export interface ServiceFormValues {
  name: string;
  description: string;
  is_active: boolean;
}

interface ServiceFormModalProps {
  mode: "add" | "edit";
  /** Pre-fills the form when editing. */
  initial?: ServiceFormValues;
  /** Lower-cased names of the OTHER services, used to block duplicates. */
  takenNames: string[];
  onCancel: () => void;
  onSave: (values: ServiceFormValues) => void;
}

export default function ServiceFormModal({
  mode,
  initial,
  takenNames,
  onCancel,
  onSave,
}: ServiceFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const trimmed = name.trim();
  const duplicate = trimmed !== "" && takenNames.includes(trimmed.toLowerCase());
  const canSave = trimmed !== "" && !duplicate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ name: trimmed, description: description.trim(), is_active: isActive });
  };

  return (
    <ModalShell
      title={mode === "add" ? "Add Service" : "Edit Service"}
      titleId="service-form-title"
      onClose={onCancel}
      closeOnBackdrop={false}
    >
      <form onSubmit={submit} className="mt-4">
        <label htmlFor="sv-name" className="block mb-1 text-xs" style={serif}>
          Service Name
        </label>
        <input
          id="sv-name"
          autoFocus
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Printing Service"
          aria-invalid={duplicate}
          aria-describedby={duplicate ? "sv-name-error" : undefined}
          className={textBox}
          style={serif}
        />
        {duplicate && (
          <p id="sv-name-error" role="alert" className="mt-1 text-xs text-[#ff2d2d]" style={serif}>
            A service with this name already exists.
          </p>
        )}

        <label htmlFor="sv-desc" className="block mt-3 mb-1 text-xs" style={serif}>
          Description
        </label>
        <textarea
          id="sv-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what this service offers..."
          className={`${textBox} resize-none`}
          style={serif}
        />

        <p className="mt-3 mb-1 text-xs" style={serif}>
          Status
        </p>
        <div className="flex gap-2" role="group" aria-label="Status">
          {([true, false] as const).map((value) => {
            const selected = isActive === value;
            const look = selected
              ? value
                ? "bg-[#7ed957] text-[#1f3d12] ring-2 ring-[#39265f]/40"
                : "bg-[#ff3b30] text-white ring-2 ring-[#39265f]/40"
              : "bg-[#f4e1eb] border border-[#c48ab2] text-[#5a4a75]";
            return (
              <button
                key={String(value)}
                type="button"
                aria-pressed={selected}
                onClick={() => setIsActive(value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${look}`}
              >
                {value ? "Active" : "Inactive"}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
          >
            SAVE
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
