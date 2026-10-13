'use client';

import { Clock3, FileCheck2, GraduationCap } from 'lucide-react';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { registrarDisplayFont } from '../../../lib/scholarshipFonts';
import type { Application, Scholarship } from '../../../lib/scholarshipData';
import { daysLeftLabel, formatDisplayDate } from '../../../lib/scholarshipUtils';
import type { ScholarshipTab } from './ScholarshipHeader';

interface Props {
  scholarships: Scholarship[];
  applications: Application[];
  onNavigate: (tab: ScholarshipTab) => void;
}

const profileFields = [
  ['Name', 'full_name'],
  ['Student ID', 'student_number'],
  ['Program', 'program'],
  ['Year & Section', 'year_section'],
] as const;

const cardClass = 'w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm';
const headingClass = `${registrarDisplayFont.className} text-2xl leading-tight text-[#48305d]`;

function StudentInformation({ loading, studentProfile }: { loading: boolean; studentProfile: unknown }) {
  if (loading) {
    return (
      <div aria-label="Loading student information" className="grid gap-4 sm:grid-cols-2">
        {profileFields.map(([label]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3">
            <span className="text-sm font-semibold">{label}</span>
            <span className="h-4 w-36 animate-pulse rounded bg-[#d8afcc]" />
          </div>
        ))}
      </div>
    );
  }
  if (!studentProfile) {
    return <p className="text-sm text-[#684f6c]">Sign in to see your information.</p>;
  }
  const profile = studentProfile as Record<string, unknown>;
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {profileFields.map(([label, field]) => {
        const value = profile[field];
        return (
          <div key={field} className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3">
            <dt className="text-sm font-semibold">{label}</dt>
            <dd className="text-right text-sm">{value == null || value === '' ? '—' : String(value)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export default function OverviewTab({ scholarships, applications, onNavigate }: Props) {
  const { studentProfile, loading } = useUserProfile();

  const openScholarships = scholarships.filter((s) => s.status === 'Open');
  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const latestDecision = applications
    .filter((a) => a.status === 'Approved' || a.status === 'Rejected')
    .sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted))[0];
  const nextDeadline = [...openScholarships].sort((a, b) => a.deadline.localeCompare(b.deadline))[0];

  const stats = [
    { label: 'Available Scholarships', value: openScholarships.length, tab: 'scholarshipList', icon: GraduationCap },
    { label: 'My Applications', value: applications.length, tab: 'myApplications', icon: FileCheck2 },
    { label: 'Pending Applications', value: pendingCount, tab: 'myApplications', icon: Clock3 },
  ] as const;

  return (
    <div className="mb-8 flex w-full flex-col gap-6">
      <section className={cardClass}>
        <h2 className={`${headingClass} mb-4`}>Student Information</h2>
        <StudentInformation loading={loading} studentProfile={studentProfile} />
      </section>

      <section aria-label="Scholarship statistics" className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, tab, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(tab)}
            className="flex items-center gap-4 rounded-md border border-[#956887] bg-[#e8c3da] p-6 text-left text-[#48305d] shadow-sm transition-colors hover:bg-[#d8a6c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
          >
            <Icon className="h-8 w-8 shrink-0 text-[#8c6895]" aria-hidden="true" />
            <span>
              <span className="block text-3xl font-bold leading-none">{value}</span>
              <span className="mt-1 block text-sm font-semibold">{label}</span>
            </span>
          </button>
        ))}
      </section>

      {latestDecision && (
        <section
          role="status"
          className={`rounded-md border p-6 shadow-sm ${
            latestDecision.status === 'Approved'
              ? 'border-green-300 bg-green-50 text-green-900'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          {latestDecision.status === 'Approved' ? (
            <p className="font-semibold">
              Congratulations! Your {latestDecision.scholarshipName} application has been approved.
            </p>
          ) : (
            <p className="font-semibold">
              Your {latestDecision.scholarshipName} application was rejected.
              {latestDecision.remarks ? ` Reason: ${latestDecision.remarks}` : ''}
            </p>
          )}
        </section>
      )}

      <section className={cardClass}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className={headingClass}>Next deadline</h2>
          {nextDeadline && (
            <span className="rounded-full bg-[#e8c3da] px-3 py-1 text-xs font-bold text-[#684f6c]">
              {daysLeftLabel(nextDeadline.deadline)}
            </span>
          )}
        </div>
        {nextDeadline ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#e8c3da] p-4">
            <div>
              <p className="font-bold">{nextDeadline.name}</p>
              <p className="mt-1 text-sm text-[#684f6c]">Deadline: {formatDisplayDate(nextDeadline.deadline)}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('scholarshipList')}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#d8a6c7] hover:text-[#48305d]"
            >
              View Details
            </button>
          </div>
        ) : (
          <p className="py-4 text-sm text-[#684f6c]">No open scholarships right now.</p>
        )}
      </section>

      <section className={cardClass}>
        <h2 className={`${headingClass} mb-4`}>Quick Actions</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { label: 'Browse Scholarships', tab: 'scholarshipList' },
              { label: 'My Applications', tab: 'myApplications' },
            ] as const
          ).map(({ label, tab }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="rounded-md bg-[#d8a6c7] px-4 py-3 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}