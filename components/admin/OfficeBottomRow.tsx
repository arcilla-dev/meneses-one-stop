"use client";

import type React from "react";
import Link from "next/link";
import { AnnouncementsPanel, type Announcement } from "@/components/admin/DashboardPanels";

const serif = { fontFamily: "Georgia, serif" } as const;

/* ------------------------------------------------------------------ */
/*  Quick actions: one component for every office                      */
/* ------------------------------------------------------------------ */

export interface QuickActionItem {
  key: string;
  label: string;
  icon: React.ElementType;
  badge?: number; // small count pill, e.g. pending requests
  onClick?: () => void; // in-page action
  href?: string; // or a link (only use routes that exist)
  filled?: boolean; // filled icon style (default true); false for stroke-only icons like refresh
  spin?: boolean;
  disabled?: boolean;
}

const rowClass = "group flex w-full items-center gap-4 text-left transition hover:translate-x-1 disabled:opacity-60";
const labelClass =
  "flex flex-1 items-center justify-between border-b border-white/70 pb-1 text-base text-white group-hover:border-white";

export function OfficeQuickActions({ actions }: { actions: QuickActionItem[] }) {
  return (
    <section className="rounded-xl border border-[#d9a9c9]/40 bg-[linear-gradient(135deg,#5E4D7C_0%,#4E3D6B_100%)] p-5 shadow-md lg:w-[320px] lg:shrink-0">
      <h2 className="mb-4 text-xl font-bold text-white md:text-2xl" style={serif}>
        Quick Actions
      </h2>
      <div className="flex flex-col gap-4" style={serif}>
        {actions.map((a) => {
          const Icon = a.icon;
          const filled = a.filled ?? true;
          const content = (
            <>
              <Icon
                size={34}
                strokeWidth={1.5}
                {...(filled ? { fill: "#E7B7D6", stroke: "#5E4D7C" } : {})}
                className={`shrink-0 ${filled ? "" : "text-[#E7B7D6]"} ${a.spin ? "animate-spin" : ""}`}
              />
              <span className={labelClass}>
                {a.label}
                {a.badge !== undefined && (
                  <span className="ml-2 rounded-full bg-[#F8C8E2] px-2 text-xs font-bold text-[#443760]">{a.badge}</span>
                )}
              </span>
            </>
          );

          return a.href ? (
            <Link key={a.key} href={a.href} className={rowClass}>
              {content}
            </Link>
          ) : (
            <button key={a.key} type="button" onClick={a.onClick} disabled={a.disabled} className={rowClass}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom row: announcements on the left, `right` (quick actions)     */
/* ------------------------------------------------------------------ */

export function OfficeBottomRow({
  announcements,
  announcementsError,
  manageHref,
  right,
}: {
  announcements: Announcement[];
  announcementsError: string | null;
  manageHref: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:px-12">
      {announcementsError ? (
        <p role="alert" className="flex-1 rounded-xl bg-rose-100 p-4 text-sm font-semibold text-rose-800">
          {announcementsError}
        </p>
      ) : (
        <AnnouncementsPanel items={announcements} manageHref={manageHref} />
      )}
      {right}
    </div>
  );
}
