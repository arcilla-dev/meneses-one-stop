"use client";

import { useState } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { registrarDisplayFont } from "./fonts";
import RequestForm from "./RequestForm";

function getFeeSummary(request) {
  if (!request.copyOptions) return request.feeNote;

  return request.copyOptions
    .map((option) =>
      option.fee === 0
        ? "Free"
        : `₱${option.fee} per copy with CTC stamp`,
    )
    .join(" · ");
}

export default function RequestsTab({
  requests,
  pendingRequests,
  onSubmitRequest,
  onAdvanceLatestRequest,
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  if (selectedRequest) {
    return (
      <RequestForm
        document={selectedRequest}
        pendingRequests={pendingRequests}
        onBack={() => setSelectedRequest(null)}
        onSubmit={onSubmitRequest}
      />
    );
  }

  const latestRequest = pendingRequests[0];

  return (
    <section className="w-full rounded-md border border-[#956887] bg-gradient-to-br from-[#bd91ad] to-[#a47a9d] p-3 shadow-sm">
      <h2 className={`${registrarDisplayFont.className} mb-2 text-center text-[17px] leading-tight text-[#48305d]`}>
        Document Requests
      </h2>
      <ul className="space-y-1.5">
        {requests.map((request) => (
          <li key={request.id}>
            <button
              type="button"
              onClick={() => setSelectedRequest(request)}
              className="flex w-full items-center gap-3 rounded-md border border-[#a96f98] bg-[#f4d2e6] px-5 py-4 text-left text-[#493352] transition-colors hover:bg-[#f8deed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
            >
              <FileText className="h-6 w-6 shrink-0 text-[#b878a2]" strokeWidth={1.7} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold">{request.title}</span>
                <span className="block truncate text-base leading-tight">{request.description}</span>
              </span>
              <span className="shrink-0 text-right text-xs leading-tight text-[#684f6c]">
                <span className="block">{request.processingTime}</span>
                <span className="block">{getFeeSummary(request)}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#64435f]" strokeWidth={3} />
            </button>
          </li>
        ))}
      </ul>
      {process.env.NODE_ENV === "development" && latestRequest && latestRequest.status !== "Ready for claiming" && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onAdvanceLatestRequest}
            className="rounded-md bg-[#87577d] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#71476b]"
          >
            Advance latest request (dev only)
          </button>
        </div>
      )}
    </section>
  );
}
