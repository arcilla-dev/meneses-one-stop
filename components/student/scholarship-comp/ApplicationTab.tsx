'use client';

import { useMemo, useState } from 'react';
import { registrarDisplayFont } from '../../../lib/scholarshipFonts';
import type { Application, ApplicationStatus } from '../../../lib/scholarshipData';
import ApplicationItem from './ApplicationItem';
import type { ScholarshipTab } from './ScholarshipHeader';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
type Filter = (typeof FILTERS)[number];

interface Props {
  applications: Application[];
  onNavigate: (tab: ScholarshipTab) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus, remarks?: string) => void;
}

export default function MyApplicationsTab({ applications, onNavigate, onUpdateStatus }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const counts: Record<Filter, number> = {
    All: applications.length,
    Pending: applications.filter((a) => a.status === 'Pending').length,
    Approved: applications.filter((a) => a.status === 'Approved').length,
    Rejected: applications.filter((a) => a.status === 'Rejected').length,
  };

  const visible = useMemo(
    () =>
      applications
        .filter((a) => activeFilter === 'All' || a.status === activeFilter)
        .sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted)),
    [activeFilter, applications],
  );

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2 className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}>My Applications</h2>
      <div aria-label="Filter applications" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              activeFilter === filter ? 'bg-[#87577d] text-white' : 'bg-[#e8c3da] text-[#684f6c] hover:bg-[#d8a6c7]'
            }`}
          >
            {filter} ({counts[filter]})
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <ul className="space-y-3">
          {visible.map((application) => (
            <ApplicationItem key={application.id} application={application} onUpdateStatus={onUpdateStatus} />
          ))}
        </ul>
      ) : applications.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#684f6c]">
          <p>You have no applications yet.</p>
          <button
            type="button"
            onClick={() => onNavigate('scholarshipList')}
            className="mt-2 rounded-md bg-[#d8a6c7] px-3 py-1.5 font-semibold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
          >
            Browse Scholarships
          </button>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-[#684f6c]">No {activeFilter.toLowerCase()} applications.</p>
      )}
    </section>
  );
}