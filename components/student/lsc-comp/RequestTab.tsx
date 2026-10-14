"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  NEXT_STATUS,
  REQUEST_STATUSES,
  type PrintRequest,
  type RequestStatus,
} from "../../../lib/lscData";
import { byDateDesc } from "../../../lib/lscUtils";
import type { LSCTab } from "./LscHeader";
import PrintRequestItem from "./PrintRequestItem";

type Filter = "All" | RequestStatus;
const filters: Filter[] = ["All", ...REQUEST_STATUSES];

interface MyRequestsTabProps {
  printRequests: PrintRequest[];
  /** Throw an Error(message) to show it in the toast. */
  onCancel: (requestId: string) => Promise<void>;
  onUpdateStatus: (requestId: string, status: RequestStatus) => Promise<void>;
  onNavigate: (tab: LSCTab) => void;
}

export default function MyRequestsTab({
  printRequests,
  onCancel,
  onUpdateStatus,
  onNavigate,
}: MyRequestsTabProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const counts = useMemo(() => {
    const result = { All: printRequests.length } as Record<Filter, number>;
    for (const status of REQUEST_STATUSES) {
      result[status] = printRequests.filter((r) => r.status === status).length;
    }
    return result;
  }, [printRequests]);

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return printRequests
      .filter((r) => filter === "All" || r.status === filter)
      .filter(
        (r) =>
          !query ||
          r.requestNumber.toLocaleLowerCase().includes(query) ||
          r.fileNames.some((name) => name.toLocaleLowerCase().includes(query)),
      )
      .sort(byDateDesc((r) => r.dateSubmitted));
  }, [filter, printRequests, search]);

  async function handleCancel(request: PrintRequest) {
    if (!window.confirm("Cancel this print request?")) return;
    try {
      await onCancel(request.id);
      setToast({ text: "Request cancelled.", error: false });
    } catch (error) {
      setToast({
        text: error instanceof Error ? error.message : "Could not cancel the request.",
        error: true,
      });
    }
  }

  async function handleAdvance(request: PrintRequest) {
    const next = NEXT_STATUS[request.status];
    if (!next) return;
    try {
      await onUpdateStatus(request.id, next);
    } catch (error) {
      setToast({
        text: error instanceof Error ? error.message : "Could not update the status.",
        error: true,
      });
    }
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2 className="mb-5 text-2xl font-bold leading-tight text-[#48305d]">
        My Requests
      </h2>

      {toast && (
        <p
          role="status"
          className={`mb-4 rounded-md border p-3 text-sm font-semibold ${
            toast.error
              ? "border-red-300 bg-red-50 text-red-900"
              : "border-green-300 bg-green-50 text-green-900"
          }`}
        >
          {toast.text}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === status
                ? "bg-[#8c6895] text-white"
                : "bg-[#e8c3da] text-[#48305d] hover:bg-[#d8a6c7]"
            }`}
          >
            {status} ({counts[status]})
          </button>
        ))}
      </div>

      <label className="mb-5 flex items-center gap-2 rounded-md border border-[#c58bb1] bg-white px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-[#8c6895]" aria-hidden="true" />
        <span className="sr-only">Search by file name or request number</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search file name or request number"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#392641] outline-none placeholder:text-[#8f7890]"
        />
      </label>

      {visibleRequests.length > 0 ? (
        <ul className="space-y-3">
          {visibleRequests.map((request) => (
            <PrintRequestItem
              key={request.id}
              request={request}
              onCancel={handleCancel}
              onAdvanceStatus={handleAdvance}
            />
          ))}
        </ul>
      ) : printRequests.length === 0 ? (
        <div className="py-8 text-center">
          <p className="font-semibold text-[#48305d]">No print requests yet.</p>
          <button
            type="button"
            onClick={() => onNavigate("services")}
            className="mt-4 rounded-md bg-[#d8a6c7] px-4 py-2.5 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
          >
            Request a Print Service
          </button>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[#684f6c]">
          {search.trim() ? "No matching print requests." : `No ${filter} requests.`}
        </p>
      )}
    </section>
  );
}