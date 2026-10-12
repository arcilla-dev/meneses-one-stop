"use client";

import { Check } from "lucide-react";
import { registrarDisplayFont } from "../registrar/fonts";

export default function ApplicationSubmitted({
  scholarship,
  application,
  onNavigate,
  onBackToList,
}) {
  return (
    <section className="mx-auto w-full max-w-2xl rounded-md border border-[#956887] bg-[#f4d4e7] p-8 text-center text-[#392641] shadow-sm">
      <h2
        className={`${registrarDisplayFont.className} text-2xl leading-tight text-[#48305d]`}
      >
        {scholarship.name}
      </h2>
      <div className="mx-auto my-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Check className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold tracking-wide text-[#48305d]">
        APPLICATION SUBMITTED
      </h3>
      <p className="mt-2 text-sm text-[#684f6c]">
        Your {scholarship.name} application has been submitted.
      </p>
      <dl className="mx-auto mt-6 grid max-w-md gap-3 rounded-md bg-[#e8c3da] p-4 text-left text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Application ID</dt>
          <dd className="mt-1 text-[#684f6c]">{application.applicationId}</dd>
        </div>
        <div>
          <dt className="font-semibold">Date Submitted</dt>
          <dd className="mt-1 text-[#684f6c]">{application.dateSubmitted}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold">Status</dt>
          <dd className="mt-1 inline-flex items-center gap-2 text-[#684f6c]">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            Pending Review
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-sm text-[#684f6c]">
        You can track your application under &quot;My Applications.&quot;
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onNavigate("myApplications")}
          className="rounded-md bg-[#87577d] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#68466f]"
        >
          View My Applications
        </button>
        <button
          type="button"
          onClick={onBackToList}
          className="rounded-md bg-[#d8a6c7] px-4 py-2.5 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
        >
          Back to Scholarship
        </button>
      </div>
    </section>
  );
}
