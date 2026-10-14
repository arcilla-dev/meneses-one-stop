'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { registrarDisplayFont } from '../../../lib/scholarshipFonts';
import type { Application, ApplicationDraft, Scholarship } from '../../../lib/scholarshipData';
import ApplicationForm from './ApplicationForm';
import ApplicationSubmitted from './ApplicationSubmitted';
import ScholarshipCard from './ScholarshipCard';
import ScholarshipDetails from './ScholarshipDetail';
import type { ScholarshipTab } from './ScholarshipHeader';

const FILTERS = ['All', 'Open', 'Closed'] as const;
type Filter = (typeof FILTERS)[number];
type View = 'list' | 'details' | 'form' | 'submitted';

interface Props {
  scholarships: Scholarship[];
  applications: Application[];
  /** Throws an Error (shown in the form) if the application can't be created. */
  onSubmitApplication: (draft: ApplicationDraft) => Promise<Application>;
  onNavigate: (tab: ScholarshipTab) => void;
}

export default function ScholarshipListTab({ scholarships, applications, onSubmitApplication, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [view, setView] = useState<View>('list');
  const [selected, setSelected] = useState<Scholarship | null>(null);
  const [submitted, setSubmitted] = useState<Application | null>(null);

  const counts: Record<Filter, number> = {
    All: scholarships.length,
    Open: scholarships.filter((s) => s.status === 'Open').length,
    Closed: scholarships.filter((s) => s.status === 'Closed').length,
  };

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return scholarships.filter(
      (s) => (activeFilter === 'All' || s.status === activeFilter) && s.name.toLocaleLowerCase().includes(term),
    );
  }, [activeFilter, scholarships, search]);

  if (view === 'details' && selected) {
    return (
      <ScholarshipDetails
        scholarship={selected}
        applications={applications}
        onBack={() => setView('list')}
        onApply={() => setView('form')}
      />
    );
  }

  if (view === 'form' && selected) {
    return (
      <ApplicationForm
        scholarship={selected}
        onCancel={() => setView('details')}
        onSubmit={onSubmitApplication}
        onSubmitted={(application) => {
          setSubmitted(application);
          setView('submitted');
        }}
      />
    );
  }

  if (view === 'submitted' && selected && submitted) {
    return (
      <ApplicationSubmitted
        scholarship={selected}
        application={submitted}
        onNavigate={onNavigate}
        onBackToList={() => {
          setSelected(null);
          setSubmitted(null);
          setView('list');
        }}
      />
    );
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2 className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}>Scholarship List</h2>
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
      <div aria-label="Filter scholarships" className="mb-5 flex flex-wrap gap-2">
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
          {visible.map((scholarship) => (
            <ScholarshipCard
              key={scholarship.id}
              scholarship={scholarship}
              onViewDetails={(item) => {
                setSelected(item);
                setView('details');
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-[#684f6c]">No scholarships found.</p>
      )}
    </section>
  );
}