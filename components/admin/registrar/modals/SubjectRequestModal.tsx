"use client";

import React, { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";

export type SubjectRequestType = "Add Subject" | "Remove Subject";
export type SubjectRequestStatus = "Pending" | "Approved" | "Rejected";

/** The fields the modal needs; the page's row type satisfies this. */
export interface SubjectRequestDetails {
  id: number | string;
  request_type: SubjectRequestType;
  status: SubjectRequestStatus;
  student_name: string;
  student_number: string;
  program_year_section: string;
  course_code: string;
  course_name: string;
  units: number; // units of the subject being added / removed
  schedule: string;
  reason: string;
  current_units: number; // student's current load
}

interface SubjectRequestModalProps {
  request: SubjectRequestDetails | null;
  onClose: () => void;
  /** Starts the confirm step; the status only changes once the confirm modal is submitted. */
  onApprove: () => void;
  onReject: () => void;
}

// Everything that differs between the two modals lives here.
const MODE: Record<SubjectRequestType, { afterLabel: string; sign: 1 | -1 }> = {
  "Add Subject": { afterLabel: "After Adding", sign: 1 },
  "Remove Subject": { afterLabel: "After Removal", sign: -1 },
};

export const STATUS_DOT: Record<SubjectRequestStatus, string> = {
  Pending: "bg-[#f5c542]",
  Approved: "bg-[#2e9e4f]",
  Rejected: "bg-[#ff2d2d]",
};

export const serif = { fontFamily: "Georgia, serif" } as const;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 mb-2 text-base font-bold uppercase tracking-wide" style={serif}>
      {children}
    </h3>
  );
}

export function Field({ label, value, id }: { label: string; value: string; id: string }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-24 shrink-0 text-right text-xs" style={serif}>
        {label}
      </label>
      <input
        id={id}
        readOnly
        value={value}
        className="min-w-0 flex-1 px-3 py-1.5 rounded-lg bg-[#f4e1eb] border border-[#c48ab2] text-xs text-[#39265f] focus:outline-none"
        style={serif}
      />
    </div>
  );
}

export default function SubjectRequestModal({ request, onClose, onApprove, onReject }: SubjectRequestModalProps) {
  const backRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isOpen = request !== null;
  useEffect(() => {
    if (!isOpen) return;
    backRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!request) return null;

  const { afterLabel, sign } = MODE[request.request_type];
  const afterUnits = request.current_units + sign * request.units;
  const title = request.request_type;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-request-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] overflow-y-auto p-3 rounded-2xl bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      >
        <div className="px-5 py-4 rounded-xl bg-[#ecd3e4] text-[#39265f]">
          <button
            ref={backRef}
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] rounded"
            style={serif}
          >
            <ArrowLeft size={14} /> Back to Requests
          </button>

          <div className="text-center mt-1">
            <p className="text-sm uppercase tracking-wide" style={serif}>
              Request Details
            </p>
            <h2
              id="subject-request-title"
              className="text-3xl font-bold uppercase tracking-wide leading-tight"
              style={serif}
            >
              {title}
            </h2>
          </div>

          <p className="flex items-center gap-2 mt-3 text-sm" style={serif}>
            Status:
            <span aria-hidden="true" className={`w-3.5 h-3.5 rounded-full ${STATUS_DOT[request.status]}`} />
            {request.status}
          </p>

          <SectionHeading>Student Information</SectionHeading>
          <div className="flex flex-col gap-2">
            <Field id="sr-name" label="Student Name" value={request.student_name} />
            <Field id="sr-number" label="Student Number" value={request.student_number} />
            <Field id="sr-yrsec" label="Year & Sec" value={request.program_year_section} />
          </div>

          <SectionHeading>Request Information</SectionHeading>
          <div className="flex flex-col gap-2">
            <Field id="sr-code" label="Course Code" value={request.course_code} />
            <Field id="sr-course" label="Course Name" value={request.course_name} />
            <Field id="sr-units" label="Units" value={request.units.toFixed(1)} />
            <Field id="sr-sched" label="Schedule" value={request.schedule} />
          </div>

          <SectionHeading>Reason</SectionHeading>
          <textarea
            readOnly
            aria-label="Reason"
            value={request.reason}
            rows={2}
            className="w-full px-3 py-1.5 rounded-lg bg-[#f4e1eb] border border-[#c48ab2] text-xs text-[#39265f] resize-none focus:outline-none"
            style={serif}
          />

          <SectionHeading>Current Subject Load</SectionHeading>
          <dl className="text-sm" style={serif}>
            <div className="flex gap-2 pl-4">
              <dt className="w-28">Current Units:</dt>
              <dd>{request.current_units.toFixed(1)}</dd>
            </div>
            <div className="flex gap-2 pl-4 mt-1">
              <dt className="w-28">{afterLabel}:</dt>
              <dd>{afterUnits.toFixed(1)}</dd>
            </div>
          </dl>

          {request.status === "Pending" ? (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                type="button"
                onClick={onReject}
                className="py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition"
              >
                REJECT
              </button>
              <button
                type="button"
                onClick={onApprove}
                className="py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition"
              >
                APPROVE
              </button>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm italic" style={serif}>
              This request has already been {request.status.toLowerCase()}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
