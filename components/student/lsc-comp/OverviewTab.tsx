"use client";

import { useMemo, type ReactNode } from "react";
import { Clock3, FileText, Megaphone, Printer, UserRound } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  LSC_CLAIM_NOTE,
  LSC_OFFICE_HOURS,
  LSC_PAYMENT_NOTE,
  type Announcement,
  type PrintRequest,
} from "../../../lib/lscData";
import { byDateDesc, formatDisplayDate, formatPeso } from "../../../lib/lscUtils";
import type { LSCTab } from "./LscHeader";

const profileFields = [
  ["Name", "full_name"],
  ["Student ID", "student_number"],
  ["Program", "program"],
  ["Year & Section", "year_section"],
] as const;

function ProfileSkeleton() {
  return (
    <div aria-label="Loading student information" className="grid gap-4 sm:grid-cols-2">
      {profileFields.map(([label]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3"
        >
          <span className="text-sm font-semibold">{label}</span>
          <span className="h-4 w-36 animate-pulse rounded bg-[#d8afcc]" />
        </div>
      ))}
    </div>
  );
}

function StudentInformation({
  loading,
  studentProfile,
}: {
  loading: boolean;
  studentProfile: Record<string, unknown> | null | undefined;
}) {
  if (loading) return <ProfileSkeleton />;
  if (!studentProfile) {
    return <p className="text-sm text-[#684f6c]">Sign in to see your information.</p>;
  }

  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {profileFields.map(([label, field]) => {
        const value = studentProfile[field];
        return (
          <div
            key={field}
            className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3"
          >
            <dt className="text-sm font-semibold">{label}</dt>
            <dd className="text-right text-sm">
              {value == null || value === "" ? "—" : String(value)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-2xl leading-tight text-[#48305d]">{children}</h2>;
}

interface OverviewTabProps {
  printRequests: PrintRequest[];
  announcements: Announcement[];
  onNavigate: (tab: LSCTab) => void;
}

export default function OverviewTab({
  printRequests,
  announcements,
  onNavigate,
}: OverviewTabProps) {
  const { studentProfile, loading } = useUserProfile();

  const activeRequests = printRequests.filter((r) =>
    ["Pending", "Printing"].includes(r.status),
  ).length;
  const readyRequests = printRequests.filter((r) => r.status === "Ready for claiming");
  const unreadAnnouncements = announcements.filter((a) => !a.read).length;

  const featuredAnnouncement = useMemo(() => {
    const sorted = [...announcements].sort(byDateDesc((a) => a.date));
    return sorted.find((a) => a.pinned) ?? sorted[0] ?? null;
  }, [announcements]);

  const stats = [
    { label: "Active Requests", value: activeRequests, tab: "myRequests", icon: Clock3 },
    { label: "Ready for Claiming", value: readyRequests.length, tab: "myRequests", icon: FileText },
    { label: "Unread Announcements", value: unreadAnnouncements, tab: "announcements", icon: Megaphone },
  ] as const;

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <UserRound className="h-7 w-7 text-[#8c6895]" aria-hidden="true" />
          <CardTitle>Student Information</CardTitle>
        </div>
        <StudentInformation
          loading={loading}
          studentProfile={studentProfile as Record<string, unknown> | null | undefined}
        />
      </section>

      <section aria-label="LSC summary" className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, tab, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(tab)}
            className="flex items-center gap-4 rounded-md border border-[#956887] bg-[#e8c3da] p-5 text-left text-[#48305d] shadow-sm transition-colors hover:bg-[#d8a6c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
          >
            <Icon className="h-8 w-8 shrink-0 text-[#8c6895]" aria-hidden="true" />
            <span>
              <span className="block text-3xl font-bold leading-none">{value}</span>
              <span className="mt-1 block text-sm font-semibold">{label}</span>
            </span>
          </button>
        ))}
      </section>

      {readyRequests.length > 0 && (
        <section className="rounded-md border border-green-300 bg-green-50 p-6 text-green-900 shadow-sm">
          {readyRequests.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-start justify-between gap-4"
            >
              <div>
                <h2 className="text-2xl leading-tight">Ready for claiming</h2>
                <p className="mt-2 font-semibold">
                  Your print request {request.requestNumber} is ready for claiming.{" "}
                  {LSC_CLAIM_NOTE} {LSC_PAYMENT_NOTE}
                </p>
                <p className="mt-1 text-sm">
                  Estimated bill: {formatPeso(request.totalBill)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("myRequests")}
                className="rounded-md bg-green-800 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-green-900"
              >
                View My Requests
              </button>
            </div>
          ))}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-[#8c6895]" aria-hidden="true" />
              <CardTitle>Latest Announcement</CardTitle>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("announcements")}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
            >
              View all
            </button>
          </div>
          {featuredAnnouncement ? (
            <article className="rounded-md bg-[#e8c3da] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-bold text-[#48305d]">{featuredAnnouncement.title}</h3>
                <time dateTime={featuredAnnouncement.date} className="text-xs text-[#684f6c]">
                  {formatDisplayDate(featuredAnnouncement.date)}
                </time>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#684f6c]">
                {featuredAnnouncement.message}
              </p>
            </article>
          ) : (
            <p className="py-4 text-sm text-[#684f6c]">No announcements yet.</p>
          )}
        </section>

        <section className="rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <Printer className="h-6 w-6 text-[#8c6895]" aria-hidden="true" />
            <CardTitle>Services</CardTitle>
          </div>
          <ul className="space-y-1 text-sm text-[#684f6c]">
            <li>Printing</li>
            <li>Scanning</li>
            <li>Photocopying</li>
          </ul>
          <p className="mt-3 text-sm font-semibold text-[#48305d]">
            Office hours: {LSC_OFFICE_HOURS}
          </p>
          <button
            type="button"
            onClick={() => onNavigate("services")}
            className="mt-4 w-full rounded-md bg-[#d8a6c7] px-4 py-3 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
          >
            Request a Print Service
          </button>
        </section>
      </div>

      <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
        <CardTitle>Quick Actions</CardTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              { label: "Request a Print Service", tab: "services" },
              { label: "My Requests", tab: "myRequests" },
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