"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { registrarDisplayFont } from "../registrar/fonts";
import ApplicationForm from "./ApplicationForm";
import ApplicationSubmitted from "./ApplicationSubmitted";
import ScholarshipCard from "./ScholarshipCard";
import ScholarshipDetails from "./ScholarshipDetails";

const filters = ["All", "Open", "Closed"];

export default function ScholarshipListTab({
  scholarships,
  applications,
  addApplication,
  addNotification,
  onNavigate,
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [view, setView] = useState("list");
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [submittedApplication, setSubmittedApplication] = useState(null);
  const counts = {
    All: scholarships.length,
    Open: scholarships.filter((scholarship) => scholarship.status === "Open")
      .length,
    Closed: scholarships.filter(
      (scholarship) => scholarship.status === "Closed",
    ).length,
  };
  const visibleScholarships = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return scholarships.filter((scholarship) => {
      const matchesFilter =
        activeFilter === "All" || scholarship.status === activeFilter;
      const matchesSearch = scholarship.name
        .toLocaleLowerCase()
        .includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, scholarships, search]);

  if (view === "details" && selectedScholarship) {
    return (
      <ScholarshipDetails
        scholarship={selectedScholarship}
        applications={applications}
        onBack={() => setView("list")}
        onApply={() => setView("form")}
      />
    );
  }

  if (view === "form" && selectedScholarship) {
    return (
      <ApplicationForm
        scholarship={selectedScholarship}
        onCancel={() => setView("details")}
        onSubmitted={(application) => {
          setSubmittedApplication(application);
          setView("submitted");
        }}
        onSubmitApplication={addApplication}
        onAddNotification={addNotification}
      />
    );
  }

  if (view === "submitted" && selectedScholarship && submittedApplication) {
    return (
      <ApplicationSubmitted
        scholarship={selectedScholarship}
        application={submittedApplication}
        onNavigate={onNavigate}
        onBackToList={() => {
          setSelectedScholarship(null);
          setSubmittedApplication(null);
          setView("list");
        }}
      />
    );
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2
        className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
      >
        Scholarship List
      </h2>
      <label className="mb-4 flex items-center gap-2 rounded-md border border-[#c99fbd] bg-white/70 px-3 py-2 text-[#684f6c] focus-within:ring-2 focus-within:ring-[#87577d]">
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">Search scholarships by name</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search scholarships"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#392641] outline-none placeholder:text-[#8f7890]"
        />
      </label>
      <div
        aria-label="Filter scholarships"
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
      {visibleScholarships.length > 0 ? (
        <ul className="space-y-3">
          {visibleScholarships.map((scholarship) => (
            <ScholarshipCard
              key={scholarship.id}
              scholarship={scholarship}
              onViewDetails={(item) => {
                setSelectedScholarship(item);
                setView("details");
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-[#684f6c]">
          No scholarships found.
        </p>
      )}
    </section>
  );
}
