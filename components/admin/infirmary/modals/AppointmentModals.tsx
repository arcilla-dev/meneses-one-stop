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

export const APPOINTMENT_REJECTION_REASONS = [
  "Schedule unavailable",
  "Service unavailable",
  "Clinic capacity reached",
  "Other",
] as const;

/** The fields the appointment modals need; the page's row type satisfies this. */
export interface AppointmentDetails {
  id: number | string;
  service: string; // e.g. "Medical Certificate"
  status: SubjectRequestStatus;
  student_name: string;
  student_number: string;
  program_year_section: string;
  preferred_date: string; // ISO timestamp
  preferred_time: string; // e.g. "01:00 PM - 02:00 PM"
  reason: string; // student's reason/remarks
}

const formatLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });

// "Medical Certificate" -> "Medical Certificate Request" (but not "Other Infirmary Requests Request")
const requestTitle = (service: string) => (/requests?$/i.test(service) ? service : `${service} Request`);

/* ------------------------------ Details ------------------------------ */

export function AppointmentRequestModal({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: AppointmentDetails;
  onClose: () => void;
  /** Starts the confirm step; the status only changes once the confirm modal is submitted. */
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <ModalShell titleId="appt-title" onClose={onClose}>
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
          Appointment Request Details
        </p>
        <h2 id="appt-title" className="text-2xl font-bold leading-tight" style={serif}>
          {requestTitle(request.service)}
        </h2>
      </div>

      <p className="flex items-center gap-2 mt-3 text-sm" style={serif}>
        Status:
        <span aria-hidden="true" className={`w-3.5 h-3.5 rounded-full ${STATUS_DOT[request.status]}`} />
        {request.status}
      </p>

      <SectionHeading>Student Information</SectionHeading>
      <div className="flex flex-col gap-2">
        <Field id="ap-name" label="Student Name" value={request.student_name} />
        <Field id="ap-number" label="Student Number" value={request.student_number} />
        <Field id="ap-yrsec" label="Year & Sec" value={request.program_year_section} />
      </div>

      <SectionHeading>Appointment Details</SectionHeading>
      <div className="flex flex-col gap-2">
        <Field id="ap-service" label="Service" value={request.service} />
        <Field id="ap-date" label="Preferred Date" value={formatLongDate(request.preferred_date)} />
        <Field id="ap-time" label="Preferred Time" value={request.preferred_time} />
        <div className="flex items-start gap-3">
          <label htmlFor="ap-reason" className="w-24 shrink-0 pt-1.5 text-right text-xs" style={serif}>
            Reason/Remarks
          </label>
          <textarea
            id="ap-reason"
            readOnly
            rows={2}
            value={request.reason}
            className="min-w-0 flex-1 px-3 py-1.5 rounded-lg bg-[#f4e1eb] border border-[#c48ab2] text-xs text-[#39265f] resize-none focus:outline-none"
            style={serif}
          />
        </div>
      </div>

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
    </ModalShell>
  );
}

/* ----------------------- Shared read-only summary ---------------------- */

function RequestSummary({ request, prefix }: { request: AppointmentDetails; prefix: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Field id={`${prefix}-type`} label="Type of Request" value={request.service} />
      <Field id={`${prefix}-student`} label="Student" value={request.student_name} />
      <Field id={`${prefix}-date`} label="Requested Date" value={formatLongDate(request.preferred_date)} />
      <Field id={`${prefix}-time`} label="Requested Time" value={request.preferred_time} />
    </div>
  );
}

/* ------------------------------ Approve ------------------------------ */

export function ApproveAppointmentModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: AppointmentDetails;
  onCancel: () => void;
  onConfirm: (remarks: string, notify: boolean) => void;
}) {
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  return (
    <ModalShell title="Approve Request" titleId="appt-approve-title" onClose={onCancel} closeOnBackdrop={false}>
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to approve this request?
      </p>

      <RequestSummary request={request} prefix="aa" />

      <label htmlFor="aa-remarks" className="block mt-4 mb-1 text-xs" style={serif}>
        Optional Remarks
      </label>
      <textarea
        id="aa-remarks"
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

export function RejectAppointmentModal({
  request,
  onCancel,
  onConfirm,
}: {
  request: AppointmentDetails;
  onCancel: () => void;
  onConfirm: (reason: string, remarks: string, notify: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);

  // A reason is required, and "Other" needs an explanation in the remarks.
  const canReject = reason !== "" && (reason !== "Other" || remarks.trim() !== "");

  return (
    <ModalShell title="Reject Request" titleId="appt-reject-title" onClose={onCancel} closeOnBackdrop={false}>
      <p className="mt-3 mb-3 text-sm font-bold" style={serif}>
        Are you sure you want to reject this request?
      </p>

      <RequestSummary request={request} prefix="ar" />

      <label htmlFor="ar-reason" className="block mt-4 mb-1 text-xs" style={serif}>
        Reason for Rejection
      </label>
      <select
        id="ar-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={textBox}
        style={serif}
      >
        <option value="" disabled>
          Select Reason...
        </option>
        {APPOINTMENT_REJECTION_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label htmlFor="ar-remarks" className="block mt-3 mb-1 text-xs" style={serif}>
        Additional Remarks
      </label>
      <textarea
        id="ar-remarks"
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

export function AppointmentResultModal({
  request,
  outcome,
  onViewRequest,
  onDone,
}: {
  request: AppointmentDetails;
  outcome: DecisionOutcome;
  onViewRequest: () => void;
  onDone: () => void;
}) {
  const approved = outcome.status === "Approved";

  return (
    <ModalShell title={request.service} titleId="appt-result-title" onClose={onDone}>
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

        <p className="mt-4 font-bold">{request.service}</p>
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
