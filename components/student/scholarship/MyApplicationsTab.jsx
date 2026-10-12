"use client";

import { useMemo, useState } from "react";
import { registrarDisplayFont } from "../registrar/fonts";
import { parseDisplayDate } from "./data";
import ApplicationItem from "./ApplicationItem";

const filters = ["All", "Pending", "Approved", "Rejected"];

export default function MyApplicationsTab({
  applications,
  onNavigate,
  onUpdateStatus,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const counts = {
    All: applications.length,
    Pending: applications.filter(
      (application) => application.status === "Pending",
    ).length,
    Approved: applications.filter(
      (application) => application.status === "Approved",
    ).length,
    Rejected: applications.filter(
      (application) => application.status === "Rejected",
    ).length,
  };
  const visibleApplications = useMemo(
    () =>
      applications
        .filter(
          (application) =>
            activeFilter === "All" || application.status === activeFilter,
        )
        .sort(
          (first, second) =>
            parseDisplayDate(second.dateSubmitted).getTime() -
            parseDisplayDate(first.dateSubmitted).getTime(),
        ),
    [activeFilter, applications],
  );

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2
        className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
      >
        My Applications
      </h2>
      <div
        aria-label="Filter applications"
        className="mb-5 flex flex-wrap gap-2"
      >
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              activeFilter === filter
                ? "bg-[#87577d] text-white"
                : "bg-[#e8c3da] text-[#684f6c] hover:bg-[#d8a6c7]"
            }`}
          >
            {filter} ({counts[filter]})
          </button>
        ))}
      </div>
      {visibleApplications.length > 0 ? (
        <ul className="space-y-3">
          {visibleApplications.map((application) => (
            <ApplicationItem
              key={application.id}
              application={application}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </ul>
      ) : applications.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#684f6c]">
          <p>You have no applications yet.</p>
          <button
            type="button"
            onClick={() => onNavigate("scholarshipList")}
            className="mt-2 rounded-md bg-[#d8a6c7] px-3 py-1.5 font-semibold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
          >
            Browse Scholarships
          </button>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[#684f6c]">
          No {activeFilter.toLowerCase()} applications.
        </p>
      )}
    </section>
  );
}
