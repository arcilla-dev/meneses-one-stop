'use client';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { registrarDisplayFont } from '../../../lib/scholarshipFonts';
import type { Application, Scholarship } from '../../../lib/scholarshipData';
import { formatDisplayDate, isWithinPeriod } from '../../../lib/scholarshipUtils';

interface Props {
  scholarship: Scholarship;
  applications: Application[];
  onBack: () => void;
  onApply: () => void;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="font-bold text-[#48305d]">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#684f6c]">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

export default function ScholarshipDetails({ scholarship, applications, onBack, onApply }: Props) {
  const alreadyApplied = applications.some(
    (a) => a.scholarshipId === scholarship.id && (a.status === 'Pending' || a.status === 'Approved'),
  );
  const canApply =
    scholarship.status === 'Open' && isWithinPeriod(scholarship.applicationStart, scholarship.applicationEnd) && !alreadyApplied;

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Scholarship List
      </button>
      <h2 className={`${registrarDisplayFont.className} mb-6 text-center text-2xl leading-tight text-[#48305d]`}>{scholarship.name}</h2>
      <div className="space-y-5">
        <section>
          <h3 className="font-bold text-[#48305d]">About the Scholarship</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#684f6c]">{scholarship.about}</p>
        </section>
        <Section title="Eligibility" items={scholarship.eligibility} />
        <Section title="Benefits" items={scholarship.benefits} />
        <section>
          <h3 className="font-bold text-[#48305d]">Application Period</h3>
          <p className="mt-1 text-sm text-[#684f6c]">
            {formatDisplayDate(scholarship.applicationStart)} to {formatDisplayDate(scholarship.applicationEnd)}
          </p>
        </section>
        <Section title="Required Documents" items={scholarship.requiredDocuments} />
      </div>
      <div className="mt-7 flex flex-col items-center">
        <button
          type="button"
          disabled={!canApply}
          onClick={onApply}
          className="rounded-md bg-[#87577d] px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#68466f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
        >
          APPLY FOR SCHOLARSHIP
        </button>
        {alreadyApplied ? (
          <p className="mt-2 text-sm text-[#684f6c]">
            <CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden="true" />
            You already applied for this scholarship.
          </p>
        ) : !canApply ? (
          <p className="mt-2 text-sm text-[#684f6c]">Applications are closed.</p>
        ) : null}
      </div>
    </section>
  );
}