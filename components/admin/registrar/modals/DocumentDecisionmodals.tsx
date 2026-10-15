"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { Field, SectionHeading, serif, STATUS_DOT } from "@/components/admin/RequestModal";
import {
  ModalShell,
  NotifyCheckbox,
  textBox,
  type DecisionOutcome,
} from "@/components/admin/DecisionModals";

export const DOCUMENT_REJECTION_REASONS = [
  "Incomplete requirements",
  "Invalid or unreadable attachment",
  "Outstanding balance or clearance",
  "Document not available",
  "Other",
] as const;

/** The fields these modals need; the page's row type satisfies this. */
export interface DocumentRequestDetails {
  id: number | string;
  request_type: string;
  status: "Pending" | "Approved" | "Rejected";
  student_name: string;
  program_year_section: string;
  reason?: string;
  reviewed_by?: string;
}

/* ------------------------------ Details ------------------------------ */

export function DocumentRequestModal({
  request,
  submitted,
  onClose,
  onApprove,
  onReject,
  onHistory,
}: {
  request: DocumentRequestDetails;
  submitted: string; // already formatted date
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onHistory: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <ModalShell title="Document Request" titleId="doc-request-title" onClose={onClose}>
      <p className="flex items-center gap-2 mt-3 text-sm" style={serif}>
        Status:
        <span aria-hidden="true" className={`w-3.5 h-3.5 rounded-full ${STATUS_DOT[request.status]}`} />
        {request.status}
      </p>

      <SectionHeading>Request Information</SectionHeading>
      <div className="flex flex-col gap-2">
        <Field id="dr-type" label="Request Type" value={request.request_type} />
        <Field id="dr-student" label="Student Name" value={request.student_name} />
        <Field id="dr-yrsec" label="Program/Yr/Sec" value={request.program_year_section} />
        <Field id="dr-date" label="Date Submitted" value={submitted} />
        {request.reviewed_by && <Field id="dr-by" label="Reviewed by" value={request.reviewed_by} />}
      </div>

      {request.status === "Rejected" && request.reason && (
        <>
          <SectionHeading>Reason</SectionHeading>
          <p className="text-sm" style={serif}>{request.reason}</p>
        </>
      )}

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
            onClick={onApprove}
            className="py-2 rounded-full bg-[#7ed957] text-[#1f3d12] text-sm font-bold shadow-md hover:brightness-105 active:scale-95 transition"
          >
            APPROVE
          </button>
        </div>
      ) : (
        <p className="mt-5 text-center text-sm italic" style={serif}>
          This request has already been {request.status.toLowerCase()}.
        </p>
      )}

      <div className="flex justify-center gap-3 mt-4">
        <button
          type="button"
          onClick={onHistory}
          className="px-5 py-1.5 rounded-full bg-[#8a5a7e] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
        >
          Status History
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="px-8 py-1.5 rounded-full bg-[#b07aa1] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------ Approve ------------------------------ */

export function ApproveDocumentModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: DocumentRequestDetails;
  onCancel: () => void;
  onConfirm: (remarks: string, notify: boolean) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  return (
    <ModalShell title="Approve Request" titleId="doc-approve-title" onClose={onCancel} closeOnBackdrop={false}>
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to approve this request?
      </p>

      <div className="flex flex-col gap-2">
        <Field id="da-type" label="Type of Request" value={request.request_type} />
        <Field id="da-student" label="Student" value={request.student_name} />
      </div>

      <label htmlFor="da-remarks" className="block mt-4 mb-1 text-xs" style={serif}>
        Optional Remarks
      </label>
      <textarea
        id="da-remarks"
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
          APPROVE
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------ Reject ------------------------------- */

export function RejectDocumentModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: DocumentRequestDetails;
  onCancel: () => void;
  onConfirm: (reason: string, remarks: string, notify: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  // A reason is required, and "Other" needs an explanation in the remarks.
  const canReject = reason !== "" && (reason !== "Other" || remarks.trim() !== "");

  return (
    <ModalShell title="Reject Request" titleId="doc-reject-title" onClose={onCancel} closeOnBackdrop={false}>
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to reject this request?
      </p>

      <div className="flex flex-col gap-2">
        <Field id="dj-type" label="Type of Request" value={request.request_type} />
        <Field id="dj-student" label="Student" value={request.student_name} />
      </div>

      <label htmlFor="dj-reason" className="block mt-4 mb-1 text-xs" style={serif}>
        Reason for Rejection
      </label>
      <select
        id="dj-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={textBox}
        style={serif}
      >
        <option value="" disabled>
          Select Reason...
        </option>
        {DOCUMENT_REJECTION_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label htmlFor="dj-remarks" className="block mt-3 mb-1 text-xs" style={serif}>
        Additional Remarks
      </label>
      <textarea
        id="dj-remarks"
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

export function DocumentResultModal({
  request,
  outcome,
  onViewRequest,
  onDone,
}: {
  request: DocumentRequestDetails;
  outcome: DecisionOutcome;
  onViewRequest: () => void;
  onDone: () => void;
}) {
  const approved = outcome.status === "Approved";

  return (
    <ModalShell title="Document Request" titleId="doc-result-title" onClose={onDone}>
      <p
        className={`flex items-center justify-center gap-2 mt-3 text-lg uppercase ${
          approved ? "text-[#2e9e4f]" : "text-[#ff2d2d]"
        }`}
        style={serif}
      >
        {approved ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
        <span className="text-[#39265f]">{approved ? "Approved" : "Request Rejected"}</span>
      </p>

      <div className="mt-4 text-sm leading-snug" style={serif}>
        <p>
          {approved ? "The Request has been approved successfully." : "The Request has been rejected."}
        </p>

        <p className="mt-4 font-bold">Student</p>
        <p>{request.student_name}</p>

        <p className="mt-4 font-bold">Request</p>
        <p>{request.request_type}</p>

        <p className="mt-4 font-bold">Status:</p>
        <p className="flex items-center gap-2 pl-4">
          <span aria-hidden="true" className={`w-3 h-3 rounded-full ${STATUS_DOT[outcome.status]}`} />
          {outcome.status}
        </p>

        {!approved && outcome.reason && (
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