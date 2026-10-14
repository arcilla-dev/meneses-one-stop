"use client";

import React, { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { ModalShell, NotifyCheckbox, textBox } from "@/components/admin/DecisionModals";
import { Field, SectionHeading, serif } from "@/components/admin/RequestModal";

export type PaperSize = "A4" | "Letter" | "Legal";
export type PrintColor = "Colored" | "B&W";
export type PrintLayout = "Portrait" | "Landscape";
export type PrintStatus = "Pending" | "Processed" | "Rejected";

export interface PrintAttachment {
  name: string;
  url: string;
}

/** The fields the modals need; the page's row type satisfies this. */
export interface PrintRequestDetails {
  id: number | string;
  status: PrintStatus;
  student_name: string;
  student_number: string;
  program_year_section: string;
  paper_size: PaperSize;
  color: PrintColor;
  layout: PrintLayout;
  pages: number;
  additional_request: string;
  attachments: PrintAttachment[];
  total: number; // in pesos
}

export type PrintOutcome = {
  status: "Processed" | "Rejected";
  reason?: string;
  remarks?: string;
};

export const PRINT_REJECTION_REASONS = [
  "File cannot be opened",
  "Incorrect file format",
  "Request information incomplete",
  "Service unavailable",
  "Other",
] as const;

// RequestModal's STATUS_DOT is typed to Approved/Rejected, so printing keeps its own map.
export const PRINT_STATUS_DOT: Record<PrintStatus, string> = {
  Pending: "bg-[#f5c542]",
  Processed: "bg-[#2e9e4f]",
  Rejected: "bg-[#ff2d2d]",
};

const typeLabel = (r: PrintRequestDetails) => `${r.paper_size} | ${r.color}`;

const peso = (n: number) =>
  `\u20B1 ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Compact label + input pair for the two-column "Printing Details" grid.
function InlineField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <label htmlFor={id} className="w-[4.5rem] shrink-0 text-right text-xs" style={serif}>
        {label}
      </label>
      <input
        id={id}
        readOnly
        value={value}
        className="min-w-0 flex-1 px-2 py-1.5 rounded-lg bg-[#f4e1eb] border border-[#c48ab2] text-xs text-[#39265f] focus:outline-none"
        style={serif}
      />
    </div>
  );
}

/* ------------------------------ Details ------------------------------ */

export function PrintRequestModal({
  request,
  onClose,
  onProcess,
  onReject,
}: {
  request: PrintRequestDetails;
  onClose: () => void;
  /** Starts the confirm step; the status only changes once the confirm modal is submitted. */
  onProcess: () => void;
  onReject: () => void;
}) {
  return (
    <ModalShell titleId="print-details-title" onClose={onClose}>
      <button
        type="button"
        autoFocus
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
          id="print-details-title"
          className="text-3xl font-bold uppercase tracking-wide leading-tight"
          style={serif}
        >
          Print
        </h2>
      </div>

      <p className="flex items-center gap-2 mt-3 text-sm" style={serif}>
        Status:
        <span
          aria-hidden="true"
          className={`w-3.5 h-3.5 rounded-full ${PRINT_STATUS_DOT[request.status]}`}
        />
        {request.status}
      </p>

      <SectionHeading>Student Information</SectionHeading>
      <div className="flex flex-col gap-2">
        <Field id="pr-name" label="Student Name" value={request.student_name} />
        <Field id="pr-yrsec" label="Year & Sec" value={request.program_year_section} />
      </div>

      <SectionHeading>Printing Details</SectionHeading>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <InlineField id="pr-paper" label="Paper Size" value={request.paper_size} />
        <InlineField id="pr-layout" label="Layout" value={request.layout} />
        <InlineField id="pr-color" label="Color" value={request.color} />
        <InlineField id="pr-pages" label="No. of Pages" value={String(request.pages)} />
      </div>

      <label htmlFor="pr-additional" className="block mt-4 mb-1 text-xs" style={serif}>
        Additional Request
      </label>
      <textarea
        id="pr-additional"
        readOnly
        rows={2}
        value={request.additional_request}
        placeholder="No additional request"
        className={`${textBox} resize-none`}
        style={serif}
      />

      <div className="flex items-start justify-between gap-3 mt-4" style={serif}>
        <div className="min-w-0">
          <h3 className="text-sm font-bold uppercase tracking-wide">Attachment/s</h3>
          <ul className="mt-1 text-xs">
            {request.attachments.length === 0 ? (
              <li className="italic">No attachments</li>
            ) : (
              request.attachments.map((file, i) => (
                <li key={`${file.name}-${i}`}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline break-all hover:text-[#9b51e0]"
                  >
                    {file.name}
                  </a>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="shrink-0 text-right">
          <h3 className="text-sm font-bold uppercase tracking-wide">Total</h3>
          <p className="mt-1 text-sm">{peso(request.total)}</p>
        </div>
      </div>

      {request.status === "Pending" ? (
        <div className="grid grid-cols-2 gap-4 mt-5">
          <button
            type="button"
            onClick={onReject}
            className="py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition"
          >
            REJECT
          </button>
          <button
            type="button"
            onClick={onProcess}
            className="py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition"
          >
            PROCESS
          </button>
        </div>
      ) : (
        <p className="mt-5 text-center text-sm italic" style={serif}>
          This request has already been {request.status.toLowerCase()}.
        </p>
      )}
    </ModalShell>
  );
}

/* ------------------------------ Process ------------------------------ */

export function ProcessPrintModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: PrintRequestDetails;
  onCancel: () => void;
  onConfirm: (remarks: string, notify: boolean) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  return (
    <ModalShell
      title="Process Request"
      titleId="process-title"
      onClose={onCancel}
      closeOnBackdrop={false}
    >
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to process this request?
      </p>

      <div className="flex flex-col gap-2">
        <Field id="pc-type" label="Type of Request" value={typeLabel(request)} />
        <Field id="pc-student" label="Student" value={request.student_name} />
        <Field id="pc-total" label="Total" value={peso(request.total)} />
      </div>

      <label htmlFor="pc-remarks" className="block mt-4 mb-1 text-xs" style={serif}>
        Optional Remarks
      </label>
      <textarea
        id="pc-remarks"
        rows={2}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Add message for the student..."
        className={`${textBox} resize-none`}
        style={serif}
      />

      <NotifyCheckbox checked={notify} onChange={setNotify} />

      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition"
        >
          CANCEL
        </button>
        <button
          type="button"
          onClick={() => onConfirm(remarks.trim(), notify)}
          className="py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition"
        >
          PROCESS
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------ Reject ------------------------------- */

export function RejectPrintModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: PrintRequestDetails;
  onCancel: () => void;
  onConfirm: (reason: string, remarks: string, notify: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  // A reason is required, and "Other" needs an explanation in the remarks.
  const canReject = reason !== "" && (reason !== "Other" || remarks.trim() !== "");

  return (
    <ModalShell
      title="Reject Request"
      titleId="reject-print-title"
      onClose={onCancel}
      closeOnBackdrop={false}
    >
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to reject this request?
      </p>

      <div className="flex flex-col gap-2">
        <Field id="rp-type" label="Type of Request" value={typeLabel(request)} />
        <Field id="rp-student" label="Student" value={request.student_name} />
        <Field id="rp-total" label="Total" value={peso(request.total)} />
      </div>

      <label htmlFor="rp-reason" className="block mt-4 mb-1 text-xs" style={serif}>
        Reason for Rejection
      </label>
      <select
        id="rp-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={textBox}
        style={serif}
      >
        <option value="" disabled>
          Select Reason...
        </option>
        {PRINT_REJECTION_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label htmlFor="rp-remarks" className="block mt-3 mb-1 text-xs" style={serif}>
        Additional Remarks
      </label>
      <textarea
        id="rp-remarks"
        rows={3}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Explain why the request was rejected..."
        className={`${textBox} resize-none`}
        style={serif}
      />

      <NotifyCheckbox checked={notify} onChange={setNotify} />

      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition"
        >
          CANCEL
        </button>
        <button
          type="button"
          disabled={!canReject}
          onClick={() => onConfirm(reason, remarks.trim(), notify)}
          className="py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
        >
          REJECT
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------ Result ------------------------------- */

export function PrintResultModal({
  request,
  outcome,
  onViewRequest,
  onDone,
}: {
  request: PrintRequestDetails;
  outcome: PrintOutcome;
  onViewRequest: () => void;
  onDone: () => void;
}) {
  const processed = outcome.status === "Processed";

  return (
    <ModalShell title="Print" titleId="print-result-title" onClose={onDone}>
      <p
        className={`flex items-center justify-center gap-2 mt-3 text-lg uppercase ${
          processed ? "text-[#2e9e4f]" : "text-[#ff2d2d]"
        }`}
        style={serif}
      >
        {processed ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
        <span className="text-[#39265f]">{processed ? "Processed" : "Request Rejected"}</span>
      </p>

      <div className="mt-4 text-sm leading-snug" style={serif}>
        <p>
          {processed
            ? "The Request has been processed successfully."
            : "The Request has been rejected."}
        </p>

        <p className="mt-4 font-bold">{typeLabel(request)}</p>
        <p>{request.student_name}</p>

        <p className="mt-4 font-bold">Status:</p>
        <p className="flex items-center gap-2 pl-4">
          <span aria-hidden="true" className={`w-3 h-3 rounded-full ${PRINT_STATUS_DOT[outcome.status]}`} />
          {outcome.status}
        </p>

        {!processed && outcome.reason && (
          <>
            <p className="mt-4 font-bold">Reason:</p>
            <p>{outcome.reason}</p>
            {outcome.remarks && <p className="mt-1 text-[#5a4a75]">{outcome.remarks}</p>}
          </>
        )}
      </div>

      <div className="flex justify-center gap-3 mt-5">
        <button
          type="button"
          onClick={onViewRequest}
          className="px-5 py-1.5 rounded-full bg-[#8a5a7e] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
        >
          View Request
        </button>
        <button
          type="button"
          autoFocus
          onClick={onDone}
          className="px-8 py-1.5 rounded-full bg-[#b07aa1] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
}
