"use client";

import React, { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import {
  Field,
  SectionHeading,
  serif,
  STATUS_DOT,
  type SubjectRequestStatus,
} from "@/components/admin/RequestModal";
import {
  ModalShell,
  NotifyCheckbox,
  textBox,
  type DecisionOutcome,
} from "@/components/admin/DecisionModals";

export const SCHOLARSHIP_REJECTION_REASONS = [
  "Does not meet eligibility requirements",
  "Incomplete requirements",
  "Invalid documents",
  "Does not meet academic requirements",
  "Application submitted after deadline",
  "Other",
] as const;

export interface Attachment {
  name: string;
  url: string;
}

/** The fields the scholarship modals need; the page's row type satisfies this. */
export interface ScholarshipDetails {
  id: number | string;
  scholarship: string; // e.g. "Academic Scholarship"
  status: SubjectRequestStatus;
  student_name: string;
  student_number: string;
  program_year_section: string;
  gpa: string; // e.g. "1.50"
  application_date: string; // ISO timestamp
  attachments: Attachment[];
}

const formatLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });

/* ------------------------------ Details ------------------------------ */

export function ScholarshipApplicationModal({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: ScholarshipDetails;
  onClose: () => void;
  /** Starts the confirm step; the status only changes once the confirm modal is submitted. */
  onApprove: () => void;
  onReject: () => void;
}) {
  // Ticks to track which attachments the reviewer has already checked.
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const toggleReviewed = (name: string) =>
    setReviewed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <ModalShell titleId="sch-title" onClose={onClose}>
      <button
        type="button"
        autoFocus
        onClick={onClose}
        className="flex items-center gap-1 text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] rounded"
        style={serif}
      >
        <ArrowLeft size={14} /> Back to Applications
      </button>

      <div className="text-center mt-1">
        <p className="text-sm uppercase tracking-wide" style={serif}>
          Application Details
        </p>
        <h2 id="sch-title" className="text-2xl font-bold uppercase leading-tight" style={serif}>
          {request.scholarship}
        </h2>
      </div>

      <p className="flex items-center gap-2 mt-3 text-sm" style={serif}>
        Status:
        <span aria-hidden="true" className={`w-3.5 h-3.5 rounded-full ${STATUS_DOT[request.status]}`} />
        {request.status === "Pending" ? "Pending Review" : request.status}
      </p>

      <SectionHeading>Student Information</SectionHeading>
      <div className="flex flex-col gap-2">
        <Field id="sch-name" label="Student Name" value={request.student_name} />
        <Field id="sch-number" label="Student Number" value={request.student_number} />
        <Field id="sch-yrsec" label="Year & Sec" value={request.program_year_section} />
      </div>

      <SectionHeading>Application Information</SectionHeading>
      <div className="flex flex-col gap-2">
        <Field id="sch-gpa" label="GPA" value={request.gpa} />
        <Field id="sch-date" label="Application Date" value={formatLongDate(request.application_date)} />
      </div>

      <SectionHeading>Attachment/s</SectionHeading>
      {request.attachments.length === 0 ? (
        <p className="text-xs text-[#5a4a75]" style={serif}>
          No files were attached.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 pl-1">
          {request.attachments.map((file) => (
            <li key={file.name} className="flex items-center gap-2 text-xs" style={serif}>
              <input
                type="checkbox"
                aria-label={`Mark ${file.name} as reviewed`}
                checked={reviewed.has(file.name)}
                onChange={() => toggleReviewed(file.name)}
                className="accent-[#39265f]"
              />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#6d3fa0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] rounded"
              >
                {file.name}
              </a>
            </li>
          ))}
        </ul>
      )}

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
          This application has already been {request.status.toLowerCase()}.
        </p>
      )}
    </ModalShell>
  );
}

/* ----------------------- Shared read-only summary ---------------------- */

function ApplicationSummary({ request, prefix }: { request: ScholarshipDetails; prefix: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Field id={`${prefix}-type`} label="Type of Request" value={request.scholarship} />
      <Field id={`${prefix}-student`} label="Student" value={request.student_name} />
      <Field id={`${prefix}-gpa`} label="GPA" value={request.gpa} />
    </div>
  );
}

/* ------------------------------ Approve ------------------------------ */

export function ApproveApplicationModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: ScholarshipDetails;
  onCancel: () => void;
  onConfirm: (remarks: string, notify: boolean) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  return (
    <ModalShell title="Approve Application" titleId="sch-approve-title" onClose={onCancel} closeOnBackdrop={false}>
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to approve this application?
      </p>

      <ApplicationSummary request={request} prefix="sa" />

      <label htmlFor="sa-remarks" className="block mt-4 mb-1 text-xs" style={serif}>
        Optional Remarks
      </label>
      <textarea
        id="sa-remarks"
        rows={2}
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Enter your reason..."
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

export function RejectApplicationModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: ScholarshipDetails;
  onCancel: () => void;
  onConfirm: (reason: string, remarks: string, notify: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  // A reason is required, and "Other" needs an explanation in the remarks.
  const canReject = reason !== "" && (reason !== "Other" || remarks.trim() !== "");

  return (
    <ModalShell title="Reject Application" titleId="sch-reject-title" onClose={onCancel} closeOnBackdrop={false}>
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to reject this application?
      </p>

      <ApplicationSummary request={request} prefix="sr" />

      <label htmlFor="sr-reason" className="block mt-4 mb-1 text-xs" style={serif}>
        Reason for Rejection
      </label>
      <select
        id="sr-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={textBox}
        style={serif}
      >
        <option value="" disabled>
          Select Reason...
        </option>
        {SCHOLARSHIP_REJECTION_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label htmlFor="sr-remarks" className="block mt-3 mb-1 text-xs" style={serif}>
        Additional Remarks
      </label>
      <textarea
        id="sr-remarks"
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

export function ApplicationResultModal({
  request,
  outcome,
  onViewApplication,
  onDone,
}: {
  request: ScholarshipDetails;
  outcome: DecisionOutcome;
  onViewApplication: () => void;
  onDone: () => void;
}) {
  const approved = outcome.status === "Approved";

  return (
    <ModalShell title={request.scholarship} titleId="sch-result-title" onClose={onDone}>
      <p
        className={`flex items-center justify-center gap-2 mt-3 text-lg uppercase ${
          approved ? "text-[#2e9e4f]" : "text-[#ff2d2d]"
        }`}
        style={serif}
      >
        {approved ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
        <span className="text-[#39265f]">{approved ? "Approved" : "Application Rejected"}</span>
      </p>

      <div className="mt-4 text-sm leading-snug" style={serif}>
        <p>
          {approved
            ? "The Application has been approved successfully."
            : "The Application has been rejected."}
        </p>

        <p className="mt-4 font-bold">{request.scholarship}</p>
        <p>{request.student_name}</p>

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
          onClick={onViewApplication}
          className="px-5 py-1.5 rounded-full bg-[#8a5a7e] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
        >
          View Application
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
