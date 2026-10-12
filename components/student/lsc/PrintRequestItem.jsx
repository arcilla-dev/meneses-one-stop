"use client";

import { useState } from "react";
import { Check, ChevronDown, FileText } from "lucide-react";
import { LSC_CLAIM_NOTE, LSC_PAYMENT_NOTE } from "./data";
import { formatPeso } from "./utils";

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-800",
  Printing: "bg-blue-100 text-blue-800",
  "Ready for claiming": "bg-green-100 text-green-800",
  Claimed: "bg-gray-200 text-gray-700",
  Cancelled: "bg-red-100 text-red-800",
};

const statusDescriptions = {
  Pending: "Waiting for LSC to start printing.",
  Printing: "Your document is being printed.",
  "Ready for claiming": `Your document/s is now available. ${LSC_CLAIM_NOTE} ${LSC_PAYMENT_NOTE}`,
};

const advanceStatus = {
  Pending: "Printing",
  Printing: "Ready for claiming",
  "Ready for claiming": "Claimed",
};

export default function PrintRequestItem({
  request,
  onCancel,
  onAdvanceStatus,
}) {
  const [expanded, setExpanded] = useState(false);
  const fileNames = request.fileNames ?? [];
  const firstFileName = fileNames[0] ?? "Unnamed file";
  const remainingFiles = fileNames.length - 1;

  return (
    <li className="overflow-hidden rounded-md border border-[#d8afcc] bg-[#f8e5f0]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[#f1d8e8]"
      >
        <FileText
          className="h-6 w-6 shrink-0 text-[#8c6895]"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-[#48305d]">
            {firstFileName}
            {remainingFiles > 0 && ` +${remainingFiles} more`}
          </span>
          <span className="mt-1 block text-xs text-[#684f6c]">
            {request.requestNumber} &bull; {request.dateSubmitted}
          </span>
          <span className="mt-2 block text-xs text-[#684f6c]">
            {request.status === "Claimed"
              ? `Claimed on ${request.dateSubmitted}.`
              : statusDescriptions[request.status]}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            statusStyles[request.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {request.status}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#684f6c] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="border-t border-[#d8afcc] px-4 pb-4 pt-3">
          <div className="space-y-3 text-sm text-[#392641]">
            <div>
              <p className="font-semibold">Files</p>
              <ul className="mt-1 list-inside list-disc text-[#684f6c]">
                {fileNames.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            </div>
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              <div><dt className="font-semibold">Paper Size</dt><dd>{request.paperSize?.toUpperCase()}</dd></div>
              <div><dt className="font-semibold">Color</dt><dd>{request.color === "bw" ? "Black & White" : "Colored"}</dd></div>
              <div><dt className="font-semibold">Layout</dt><dd className="capitalize">{request.layout}</dd></div>
              <div><dt className="font-semibold">Pages</dt><dd>{request.pages}</dd></div>
            </dl>
            {request.additionalRequest && (
              <p>
                <span className="font-semibold">Additional Request: </span>
                {request.additionalRequest}
              </p>
            )}
            <p className="font-bold text-[#48305d]">
              Estimated bill: {formatPeso(request.totalBill)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {request.status === "Pending" && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCancel(request);
                }}
                className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 transition-colors hover:bg-red-100"
              >
                Cancel Request
              </button>
            )}
            {advanceStatus[request.status] && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onAdvanceStatus(request);
                }}
                className="inline-flex items-center gap-1 rounded-md bg-[#e8c3da] px-3 py-2 text-xs font-bold text-[#48305d] transition-colors hover:bg-[#d8a6c7]"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Advance status <span className="font-normal">(dev only)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
