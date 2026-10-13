"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { serif } from "@/components/admin/RequestModal";
import { ModalShell, textBox } from "@/components/admin/DecisionModals";

export interface ProgramValues {
  name: string;
  description: string;
  eligibility: string[];
  benefits: string[];
  period_start: string; // "YYYY-MM-DD" or ""
  period_end: string; // "YYYY-MM-DD" or ""
  required_documents: string[];
  is_active: boolean;
}

interface ProgramFormModalProps {
  mode: "add" | "edit";
  initial?: ProgramValues;
  onCancel: () => void;
  onSubmit: (values: ProgramValues) => void;
}

const EMPTY: ProgramValues = {
  name: "",
  description: "",
  eligibility: [],
  benefits: [],
  period_start: "",
  period_end: "",
  required_documents: [],
  is_active: true,
};

/* ------------------------- Bulleted list field ------------------------- */
// Enter adds a new bullet, Backspace on an empty bullet removes it.

function BulletListField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  useEffect(() => {
    if (focusIndex !== null) {
      refs.current[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex]);

  const update = (i: number, value: string) => onChange(items.map((item, j) => (j === i ? value : item)));

  const addAfter = (i: number) => {
    const next = [...items];
    next.splice(i + 1, 0, "");
    onChange(next);
    setFocusIndex(i + 1);
  };

  const remove = (i: number) => {
    if (items.length === 1) {
      onChange([""]);
      return;
    }
    onChange(items.filter((_, j) => j !== i));
    setFocusIndex(Math.max(0, i - 1));
  };

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-sm" style={serif}>
        {label}
      </legend>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span aria-hidden="true" className="text-[#5a4a75]">
            &bull;
          </span>
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={item}
            aria-label={`${label} ${i + 1}`}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (item.trim() !== "") addAfter(i);
              } else if (e.key === "Backspace" && item === "" && items.length > 1) {
                e.preventDefault();
                remove(i);
              }
            }}
            className={textBox}
            style={serif}
          />
          {items.length > 1 && (
            <button
              type="button"
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
              onClick={() => remove(i)}
              className="shrink-0 p-1 rounded text-[#6d5b7a] hover:text-[#ff3b30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => addAfter(items.length - 1)}
        className="self-start ml-4 text-xs text-[#6d3fa0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] rounded"
        style={serif}
      >
        + Add another
      </button>
    </fieldset>
  );
}

/* --------------------------------- Modal -------------------------------- */

export default function ProgramFormModal({ mode, initial, onCancel, onSubmit }: ProgramFormModalProps) {
  const start = initial ?? EMPTY;
  const [name, setName] = useState(start.name);
  const [description, setDescription] = useState(start.description);
  const [eligibility, setEligibility] = useState(start.eligibility.length ? start.eligibility : [""]);
  const [benefits, setBenefits] = useState(start.benefits.length ? start.benefits : [""]);
  const [periodStart, setPeriodStart] = useState(start.period_start);
  const [periodEnd, setPeriodEnd] = useState(start.period_end);
  const [documents, setDocuments] = useState(
    start.required_documents.length ? start.required_documents : [""]
  );
  const [isActive, setIsActive] = useState(start.is_active);

  const periodInvalid = periodStart !== "" && periodEnd !== "" && periodEnd < periodStart;
  const canSubmit = name.trim() !== "" && !periodInvalid;

  const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      eligibility: clean(eligibility),
      benefits: clean(benefits),
      period_start: periodStart,
      period_end: periodEnd,
      required_documents: clean(documents),
      is_active: mode === "add" ? true : isActive,
    });
  };

  return (
    <ModalShell
      title={mode === "add" ? "Add Program" : "Edit Program"}
      titleId="program-form-title"
      onClose={onCancel}
      closeOnBackdrop={false}
    >
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 text-[#39265f]">
        <label className="flex flex-col gap-1 text-sm" style={serif}>
          Scholarship Name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Academic Scholarship"
            className={textBox}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm" style={serif}>
          Short Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One line about who this is for"
            className={textBox}
          />
        </label>

        <BulletListField
          label="Eligibility"
          items={eligibility}
          onChange={setEligibility}
          placeholder="Add a requirement"
        />

        <BulletListField
          label="Benefits"
          items={benefits}
          onChange={setBenefits}
          placeholder="Add a benefit"
        />

        <fieldset>
          <legend className="mb-1 text-sm" style={serif}>
            Application Period
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Application period start"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className={textBox}
            />
            <span className="text-sm" style={serif}>
              to
            </span>
            <input
              type="date"
              aria-label="Application period end"
              value={periodEnd}
              min={periodStart || undefined}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className={textBox}
            />
          </div>
          {periodInvalid && (
            <p role="alert" className="mt-1 text-xs text-[#c0262d]" style={serif}>
              The end date must be on or after the start date.
            </p>
          )}
        </fieldset>

        <BulletListField
          label="Required Documents"
          items={documents}
          onChange={setDocuments}
          placeholder="Add a document"
        />

        {/* Only when editing: the wireframe's Publish button always creates an active program. */}
        {mode === "edit" && (
          <fieldset className="flex items-center gap-4 text-sm" style={serif}>
            <legend className="sr-only">Program status</legend>
            <span>Status:</span>
            {[true, false].map((value) => (
              <label key={String(value)} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="program-status"
                  checked={isActive === value}
                  onChange={() => setIsActive(value)}
                  className="accent-[#39265f]"
                />
                {value ? "Active" : "Inactive"}
              </label>
            ))}
          </fieldset>
        )}

        <div className="grid grid-cols-2 gap-4 mt-1">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
          >
            {mode === "add" ? "PUBLISH" : "SAVE"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
