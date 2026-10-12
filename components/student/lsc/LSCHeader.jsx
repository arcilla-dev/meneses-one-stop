"use client";

import { UsersRound } from "lucide-react";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "services", label: "Services" },
  { key: "myRequests", label: "My Requests" },
  { key: "announcements", label: "Announcements" },
];

export default function LSCHeader({ activeTab, onTabChange }) {
  return (
    <section className="relative isolate overflow-hidden rounded-xl bg-[#33213f] px-4 py-3 text-[#fff0f8] shadow-sm sm:px-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[url('/campus-bg.png')] bg-cover bg-[center_44%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#392542]/95 via-[#482b46]/85 to-[#351f38]/95"
      />
      <div className="flex items-center gap-4">
        <UsersRound
          className="h-9 w-9 shrink-0 text-[#d59bc1]"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <div>
          <h1 className="text-3xl font-bold leading-none tracking-tight">
            Local Student Council
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#f5d8e9] sm:text-sm">
            Student services, print requests, and campus announcements.
          </p>
        </div>
      </div>
      <div className="my-2 flex items-center gap-2" aria-hidden="true">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d699c0] to-[#d699c0]" />
        <span className="h-1.5 w-1.5 rotate-45 bg-[#d699c0]" />
        <span className="h-px flex-1 bg-gradient-to-r from-[#d699c0] via-[#d699c0] to-transparent" />
      </div>
      <nav
        aria-label="Local Student Council sections"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            aria-current={activeTab === key ? "page" : undefined}
            className={`rounded-md px-2 py-2 text-center font-sans text-xs font-bold transition-colors ${
              activeTab === key
                ? "bg-[#c58bb1] text-white shadow-inner"
                : "bg-[#d8a6c7] text-white hover:bg-[#c58bb1]"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </section>
  );
}
