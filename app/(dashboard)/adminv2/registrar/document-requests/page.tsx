"use client";

import React, { useEffect, useMemo, useState } from "react";
import RequestStatCards, { StatKey } from "@/components/admin/RequestStatCards"; // adjust to wherever you saved it
import StatusHistoryModal, { StatusEvent } from "@/components/admin/registrar/modals/StatusHistoryModal";
import { fetchDocumentRequests } from "@/lib/adminregistrarApi";

type RequestStatus = "Pending" | "Approved" | "Rejected";
type RequestCategory = "COR" | "ROG" | "Good Moral" | "Other";
type CategoryTab = "ALL" | RequestCategory;

const CATEGORY_TABS: CategoryTab[] = ["ALL", "COR", "ROG", "Good Moral", "Other"];

interface RequestRow {
  id: number | string;
  request_type: string; // full label shown in the table
  category: RequestCategory; // drives the filter tabs
  student_name: string;
  program_year_section: string; // e.g. "BSCpE - 4B"
  created_at: string; // ISO timestamp
  status: RequestStatus;
  history: StatusEvent[]; // timeline shown in the Status History modal
  reason?: string; // rejection reason
  reviewed_by?: string;
}

// Section label above the table follows the selected stat card.
const SECTION_TITLES: Record<StatKey, string> = {
  total: "All Requests",
  pending: "Pending Requests",
  approved: "Approved Requests",
  rejected: "Rejected Requests",
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  Pending: "bg-[#f5c542] text-[#39265f]",
  Approved: "bg-[#2e9e4f] text-white",
  Rejected: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

export default function DocumentRequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusKey, setStatusKey] = useState<StatKey>("total");
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("ALL");
  const [selected, setSelected] = useState<RequestRow | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        setRequests((await fetchDocumentRequests()) as RequestRow[]);
        setLoadError("");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Could not load requests.");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        const matchesStatus = statusKey === "total" || r.status.toLowerCase() === statusKey;
        const matchesCategory = categoryTab === "ALL" || r.category === categoryTab;
        return matchesStatus && matchesCategory;
      }),
    [requests, statusKey, categoryTab]
  );

  const handleRowSelect = (row: RequestRow) => setSelected(row);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-6xl mx-auto">
        {/* Stat cards double as the status filter */}
        <RequestStatCards
          {...counts}
          loading={loading}
          activeKey={statusKey}
          onSelect={setStatusKey}
        />

        {/* Category tabs */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={categoryTab === tab}
                onClick={() => setCategoryTab(tab)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                  categoryTab === tab ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="h-[2px] flex-1 bg-[#39265f]/40 rounded-full" />
        </div>

        {/* Table panel */}
        <section className="rounded-xl bg-[#d8abca] p-4 md:p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <h2
            className="inline-block mb-4 px-6 py-2 rounded-lg bg-[#b07aa1] text-white text-lg font-bold uppercase tracking-wide"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {SECTION_TITLES[statusKey]}
          </h2>

          {loading ? (
            <p className="text-center text-[#5a4a75] py-8">Loading requests...</p>
          ) : loadError ? (
            <p role="alert" className="text-center font-semibold text-red-800 py-8">{loadError}</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center text-[#5a4a75] py-8">No requests found for this filter.</p>
          ) : (
            <div className="max-h-[55vh] overflow-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-sm text-[#39265f]">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {["Request Type", "Student Name", "Program/Yr/Sec", "Date", "Status"].map((h) => (
                      <th
                        key={h}
                        className="bg-[#b07aa1] text-white font-bold px-3 py-2 text-center"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      onClick={() => handleRowSelect(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowSelect(row);
                        }
                      }}
                      className="cursor-pointer bg-[#f4e1eb] hover:bg-[#efd2e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] transition-colors"
                    >
                      <td className="px-3 py-2">{row.request_type}</td>
                      <td className="px-3 py-2">{row.student_name}</td>
                      <td className="px-3 py-2 text-center">{row.program_year_section}</td>
                      <td className="px-3 py-2 text-center">{formatDate(row.created_at)}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block min-w-[84px] px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <StatusHistoryModal request={selected} onClose={() => setSelected(null)} />
    </div>
  );
}