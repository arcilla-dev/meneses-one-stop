"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { registrarDisplayFont } from "../registrar/fonts";
import { parseDisplayDate } from "./data";

function dayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isApplicationPeriodOpen(scholarship) {
  const today = dayStart(new Date());
  const start = dayStart(parseDisplayDate(scholarship.applicationStart));
  const end = dayStart(parseDisplayDate(scholarship.applicationEnd));
  return today >= start && today <= end;
}

export default function ScholarshipDetails({
  scholarship,
  applications,
  onBack,
  onApply,
}) {
  const alreadyApplied = applications.some(
    (application) =>
      application.scholarshipId === scholarship.id &&
      ["Pending", "Approved"].includes(application.status),
  );
  const withinPeriod = isApplicationPeriodOpen(scholarship);
  const canApply =
    scholarship.status === "Open" && withinPeriod && !alreadyApplied;

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
      <h2
        className={`${registrarDisplayFont.className} mb-6 text-center text-2xl leading-tight text-[#48305d]`}
      >
        {scholarship.name}
      </h2>
      <div className="space-y-5">
        <section>
          <h3 className="font-bold text-[#48305d]">About the Scholarship</h3>
          <p className="mt-1 text-sm leading-relaxed text-[#684f6c]">
            {scholarship.about}
          </p>
        </section>
        <section>
          <h3 className="font-bold text-[#48305d]">Eligibility</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#684f6c]">
            {scholarship.eligibility.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-bold text-[#48305d]">Benefits</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#684f6c]">
            {scholarship.benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-bold text-[#48305d]">Application Period</h3>
          <p className="mt-1 text-sm text-[#684f6c]">
            {scholarship.applicationStart} to {scholarship.applicationEnd}
          </p>
        </section>
        <section>
          <h3 className="font-bold text-[#48305d]">Required Documents</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#684f6c]">
            {scholarship.requiredDocuments.map((document) => (
              <li key={document}>{document}</li>
            ))}
          </ul>
        </section>
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
          <p className="mt-2 text-sm text-[#684f6c]">
            Applications are closed.
          </p>
        ) : null}
      </div>
    </section>
  );
}
