"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import {
  Field,
  serif,
  STATUS_DOT,
  type SubjectRequestDetails,
} from "@/components/admin/registrar/modals/SubjectRequestModal";

export const REJECTION_REASONS = [
  "Prerequisite not completed",
  "Unit limit exceeded",
  "Subject not available",
  "Subject is already full",
  "Other",
] as const;

export type DecisionOutcome = {
  status: "Approved" | "Rejected";
  reason?: string;
  remarks?: string;
};

// Shared frame: purple gradient border, light inner card, Escape to cancel.
function ModalShell({
  title,
  titleId,
  onClose,
  closeOnBackdrop = true,
  children,
}: {
  title?: string;
  titleId: string;
  onClose: () => void;
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm max-h-[92vh] overflow-y-auto p-3 rounded-2xl bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      >
        <div className="px-5 py-4 rounded-xl bg-[#ecd3e4] text-[#39265f]">
          {title && (
            <h2
              id={titleId}
              className="text-center text-2xl font-bold uppercase tracking-wide"
              style={serif}
            >
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function NotifyCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 mt-3 text-xs cursor-pointer" style={serif}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#39265f]"
      />
      Notify student about this decision
    </label>
  );
}

const textBox =
  "w-full px-3 py-1.5 rounded-lg bg-[#f4e1eb] border border-[#c48ab2] text-xs text-[#39265f] placeholder:text-[#5a4a75]/70 focus:outline-none focus:border-[#9b51e0]";

const requestLabel = (r: SubjectRequestDetails) => `${r.request_type} \u201C${r.course_code}\u201D`;

/* ------------------------------ Approve ------------------------------ */

export function ApproveRequestModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: SubjectRequestDetails;
  onCancel: () => void;
  onConfirm: (remarks: string, notify: boolean) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  return (
    <ModalShell
      title="Approve Request"
      titleId="approve-title"
      onClose={onCancel}
      closeOnBackdrop={false}
    >
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to approve this request?
      </p>

      <div className="flex flex-col gap-2">
        <Field id="ap-type" label="Type of Request" value={requestLabel(request)} />
        <Field id="ap-student" label="Student" value={request.student_name} />
        <Field id="ap-number" label="Student Number" value={request.student_number} />
      </div>

      <label htmlFor="ap-remarks" className="block mt-4 mb-1 text-xs" style={serif}>
        Optional Remarks
      </label>
      <textarea
        id="ap-remarks"
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

export function RejectRequestModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: SubjectRequestDetails;
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
      titleId="reject-title"
      onClose={onCancel}
      closeOnBackdrop={false}
    >
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to reject this request?
      </p>

      <div className="flex flex-col gap-2">
        <Field id="rj-type" label="Type of Request" value={requestLabel(request)} />
        <Field id="rj-student" label="Student" value={request.student_name} />
        <Field id="rj-number" label="Student Number" value={request.student_number} />
      </div>

      <label htmlFor="rj-reason" className="block mt-4 mb-1 text-xs" style={serif}>
        Reason for Rejection
      </label>
      <select
        id="rj-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={textBox}
        style={serif}
      >
        <option value="" disabled>
          Select Reason...
        </option>
        {REJECTION_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label htmlFor="rj-remarks" className="block mt-3 mb-1 text-xs" style={serif}>
        Additional Remarks
      </label>
      <textarea
        id="rj-remarks"
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

export function DecisionResultModal({
  request,
  outcome,
  onViewRequest,
  onDone,
}: {
  request: SubjectRequestDetails;
  outcome: DecisionOutcome;
  onViewRequest: () => void;
  onDone: () => void;
}) {
  const approved = outcome.status === "Approved";
  const verb = request.request_type.split(" ")[0]; // "Add" | "Remove"

  return (
    <ModalShell title={request.request_type} titleId="result-title" onClose={onDone}>
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
          {approved
            ? "The Request has been approved successfully."
            : "The Request has been rejected."}
        </p>

        <p className="mt-4 font-bold">Student</p>
        <p>{request.student_name}</p>

        <p className="mt-4 font-bold">
          Request {verb} {"\u201C"}
          {request.course_code}
          {"\u201D"}
        </p>
        <p>{request.course_name}</p>

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
