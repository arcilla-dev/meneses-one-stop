"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

const statusStyles = {
  Approved: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Rejected: "bg-red-100 text-red-700",
};

export default function ApplicationItem({ application, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `application-details-${application.id}`;

  return (
    <li className="rounded-md bg-[#e8c3da] p-4 text-[#392641]">
      <div className="flex flex-wrap items-start gap-3">
        <FileText
          className="mt-0.5 h-5 w-5 shrink-0 text-[#8c6895]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">{application.scholarshipName}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                statusStyles[application.status] ??
                "bg-gray-100 text-gray-700"
              }`}
            >
              {application.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#684f6c]">
            Submitted: {application.dateSubmitted}
          </p>
          {application.status === "Rejected" && application.remarks && (
            <p className="mt-2 text-sm text-red-700">
              Reason: {application.remarks}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#684f6c] transition-colors hover:bg-[#d8a6c7] hover:text-[#48305d]"
        >
          {expanded ? "Hide Application" : "View Application"}
        </button>
      </div>
      {expanded && (
        <dl
          id={detailsId}
          className="mt-4 grid gap-2 border-t border-[#d8afcc] pt-3 text-sm sm:grid-cols-2"
        >
          <div>
            <dt className="font-semibold">Date submitted</dt>
            <dd className="text-[#684f6c]">{application.dateSubmitted}</dd>
          </div>
          <div>
            <dt className="font-semibold">Application ID</dt>
            <dd className="text-[#684f6c]">{application.applicationId || "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold">Status</dt>
            <dd className="text-[#684f6c]">{application.status}</dd>
          </div>
          <div>
            <dt className="font-semibold">Contact information</dt>
            <dd className="text-[#684f6c]">
              {application.contact ? (
                <>
                  <span className="block">{application.contact.email}</span>
                  <span className="block">{application.contact.phone}</span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold">Remarks</dt>
            <dd className="text-[#684f6c]">{application.remarks || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold">Submitted documents</dt>
            {application.documents?.length ? (
              <ul className="mt-1 list-disc pl-5 text-[#684f6c]">
                {application.documents.map((document, index) => (
                  <li key={`${document}-${index}`}>{document}</li>
                ))}
              </ul>
            ) : (
              <dd className="text-[#684f6c]">—</dd>
            )}
          </div>
        </dl>
      )}
      {application.status === "Pending" && (
        <div className="mt-3 border-t border-[#d8afcc] pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8f7890]">
            Development controls (dev only)
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(application.id, "Approved")}
              className="rounded-md bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800 transition-colors hover:bg-green-200"
            >
              Approve (dev only)
            </button>
            <button
              type="button"
              onClick={() => {
                const reason = window.prompt("Enter a rejection reason:");
                if (reason?.trim()) {
                  onUpdateStatus(application.id, "Rejected", reason.trim());
                }
              }}
              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-200"
            >
              Reject (dev only)
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
