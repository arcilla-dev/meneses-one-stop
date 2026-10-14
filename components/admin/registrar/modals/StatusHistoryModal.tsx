"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type HistoryStatus = "Request Submitted" | "Under Review" | "Approved" | "Rejected";

export interface StatusEvent {
  label: HistoryStatus;
  at: string; // ISO timestamp
}

/** The fields the modal needs; the page's row type satisfies this. */
export interface StatusHistoryRequest {
  request_type: string;
  student_name: string;
  history: StatusEvent[];
  reason?: string; // shown for rejected requests
  reviewed_by?: string; // shown once someone has reviewed it
}

interface StatusHistoryModalProps {
  request: StatusHistoryRequest | null;
  onClose: () => void;
}

// Dot color for the timeline; in-progress steps stay purple, final outcomes get a status color.
const DOT_COLOR: Record<HistoryStatus, string> = {
  "Request Submitted": "bg-[#39265f]",
  "Under Review": "bg-[#39265f]",
  Approved: "bg-[#2e9e4f]",
  Rejected: "bg-[#f53c3d]",
};

const formatStamp = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} \u2022 ${time}`;
};

export default function StatusHistoryModal({ request, onClose }: StatusHistoryModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!request) return;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [request, onClose]);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-history-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm p-3 rounded-2xl bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close status history"
          onClick={onClose}
          className="absolute top-1.5 right-1.5 text-white rounded hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={18} strokeWidth={3} />
        </button>

        <div className="mt-3 px-5 py-4 rounded-xl bg-[#ecd3e4] text-[#39265f]">
          <h2
            id="status-history-title"
            className="text-center text-xl font-bold uppercase tracking-wide"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Status History
          </h2>
          <p className="text-center text-xs text-[#5a4a75] mt-1 mb-4" style={{ fontFamily: "Georgia, serif" }}>
            {request.request_type} &mdash; {request.student_name}
          </p>

          <ol className="text-sm" style={{ fontFamily: "Georgia, serif" }}>
            {request.history.map((event, i) => {
              const isLast = i === request.history.length - 1;
              return (
                <li key={`${event.label}-${i}`} className="relative pl-6 pb-4 last:pb-0">
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-[7px] w-2 h-2 rounded-full ${DOT_COLOR[event.label]}`}
                  />
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[3.5px] top-[17px] -bottom-[5px] w-px bg-[#39265f]/60"
                    />
                  )}
                  <p className="font-semibold">{event.label}</p>
                  <p className="text-[#5a4a75]">{formatStamp(event.at)}</p>
                </li>
              );
            })}
          </ol>

          {(request.reason || request.reviewed_by) && (
            <div className="mt-5 text-center text-sm" style={{ fontFamily: "Georgia, serif" }}>
              {request.reason && <p>Reason: {request.reason}</p>}
              {request.reviewed_by && <p>Reviewed by: {request.reviewed_by}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
