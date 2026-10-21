"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  FileSignature,
  GraduationCap,
  PlusSquare,
  Users,
  Search,
  ChevronDown,
} from "lucide-react";
import { Dela_Gothic_One } from "next/font/google";
import Image from "next/image";

// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

type SortOption = "Most recent" | "Oldest";
const SORT_OPTIONS: SortOption[] = ["Most recent", "Oldest"];

interface AnnouncementItem {
  id: number | string;
  title: string;
  message: string;
  created_at: string;
  announcement_type: string;
  office?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  enrollment: FileSignature,
  infirmary: PlusSquare,
  scholarship: GraduationCap,
  printing: Users,
};

const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

/* ---------- Shared UI tokens (identical across all pages) ---------- */
const NAV_BTN =
  "flex h-14 w-full items-center justify-center rounded-lg border-2 border-[#956084] px-3 text-center text-sm leading-tight tracking-wide shadow-sm transition hover:brightness-105 active:scale-95 md:h-16 md:text-base";
const TAB_INACTIVE = "bg-[#D8ABCA] text-[#39265f]";
const TAB_ACTIVE =
  "bg-[#956084] text-white ring-2 ring-offset-2 ring-[#39265f]/30";
const CARD_TITLE = "text-base font-bold text-[#39265f] sm:text-lg";
const CARD_TEXT = "text-sm text-[#6d5b7a]";
const ICON_BADGE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#956084] bg-[#c48ab2]/70 sm:h-14 sm:w-14";

const timeAgo = (iso: string) => {
  const minutes = Math.floor(
    Math.max(0, Date.now() - new Date(iso).getTime()) / 60000
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildMockAnnouncements = (): AnnouncementItem[] => {
  const hoursAgo = (h: number) =>
    new Date(Date.now() - h * 3600 * 1000).toISOString();

  return [
    {
      id: 1,
      title: "Enrollment Schedule for 2nd Semester 2026-2027",
      message:
        "Enrollment for the 2nd semester opens next month. Check your college's schedule and settle any clearances beforehand.",
      created_at: hoursAgo(2),
      announcement_type: "enrollment",
      office: "Registrar's Office",
    },
    {
      id: 2,
      title: "Free Medical Check-up for BSU-MC Students",
      message:
        "The infirmary is offering free medical check-ups this week. Bring your school ID to the infirmary.",
      created_at: hoursAgo(4),
      announcement_type: "infirmary",
      office: "Infirmary",
    },
    {
      id: 3,
      title: "Registration Reminder",
      message:
        "Make sure your registration details are complete before the enrollment period starts.",
      created_at: hoursAgo(26),
      announcement_type: "enrollment",
      office: "Registrar's Office",
    },
    {
      id: 4,
      title: "Scholarship Interview Schedule",
      message:
        "Shortlisted applicants will be notified of their interview schedules by email.",
      created_at: hoursAgo(28),
      announcement_type: "scholarship",
      office: "Scholarship Office",
    },
    {
      id: 5,
      title: "Scholarship Application Open",
      message:
        "Applications for the academic scholarship are now open until the end of the month.",
      created_at: hoursAgo(50),
      announcement_type: "scholarship",
      office: "Scholarship Office",
    },
    {
      id: 6,
      title: "LSC Printing Services Update",
      message:
        "Printing services at the LSC office are now available on weekdays from 8 AM to 5 PM.",
      created_at: hoursAgo(52),
      announcement_type: "printing",
      office: "Learning Support Center",
    },
  ];
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("Most recent");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<
    AnnouncementItem["id"] | null
  >(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);

      // Supabase version:
      // const { data, error } = await supabase
      //   .from("announcements")
      //   .select("*")
      //   .order("created_at", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setAnnouncements(data as AnnouncementItem[]);
      // }

      await new Promise((resolve) => setTimeout(resolve, 200));
      setAnnouncements(buildMockAnnouncements());
      setLoading(false);
    };

    loadAnnouncements();
  }, []);

  const visibleAnnouncements = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matches = announcements.filter(
      (a) =>
        q === "" ||
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        (a.office ?? "").toLowerCase().includes(q)
    );

    return [...matches].sort((a, b) => {
      const diff =
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime();

      return sort === "Most recent" ? diff : -diff;
    });
  }, [announcements, query, sort]);

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Background logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 h-0"
      >
        <div className="absolute left-0 top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <img
            src="/icons/announce-bg.png"
            alt=""
            className="h-[90vh] w-auto max-w-none -translate-y-[4%] select-none opacity-25"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 text-[#39265f]">
          <Image
            src="/icons/announcement-icon.png"
            alt="Announcements"
            width={56}
            height={56}
            className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          />

          <div>
            <h1
              className={`${delaGothicOne.className} text-3xl tracking-wide md:text-5xl`}
            >
              Announcements
            </h1>

            <p
              className="mt-1 text-sm tracking-widest text-[#6d5b7a]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Official announcements from different offices
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-4 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-4 flex gap-1 text-[#39265f]">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Sort and search controls (same grid + button size as the tab rows) */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-6 md:gap-4">
          <div className="relative w-full">
            <select
              aria-label="Sort announcements"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={`${delaGothicOne.className} h-14 w-full appearance-none rounded-lg border-2 border-[#956084] py-0 pl-4 pr-10 text-sm tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-[#39265f]/30 md:h-16 md:text-base ${TAB_ACTIVE}`}
            >
              {SORT_OPTIONS.map((option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-[#fff0f6] text-[#39265f]"
                >
                  {option}
                </option>
              ))}
            </select>

            <ChevronDown
              size={22}
              strokeWidth={2.5}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
            />
          </div>

          <button
            type="button"
            aria-label="Search announcements"
            aria-pressed={showSearch}
            onClick={() => {
              setShowSearch((prev) => !prev);
              if (showSearch) setQuery("");
            }}
            className={`${NAV_BTN} sm:col-start-4 ${
              showSearch ? TAB_ACTIVE : TAB_INACTIVE
            }`}
          >
            <Search size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search input */}
        {showSearch && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements..."
            autoFocus
            className="mb-4 w-full rounded-lg border-2 border-[#956084] bg-[#fff0f6]/90 px-4 py-3 text-base text-[#39265f] placeholder:text-[#6d5b7a]/70 focus:outline-none focus:ring-2 focus:ring-[#956084]/50"
          />
        )}

        {/* Announcements list */}
        {loading ? (
          <p className="py-8 text-center text-[#6d5b7a]">
            Loading announcements...
          </p>
        ) : visibleAnnouncements.length === 0 ? (
          <p className="py-8 text-center text-[#6d5b7a]">
            {query.trim() !== ""
              ? "No announcements match your search."
              : "No announcements yet."}
          </p>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1 sm:pr-2">
            {visibleAnnouncements.map((item) => {
              const Icon = getIconForType(item.announcement_type);
              const isExpanded = expandedId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                  className="flex w-full items-start justify-between gap-3 rounded-lg border-2 border-[#c48ab2] bg-[#fbe6f0]/90 p-3 text-left shadow-sm transition hover:border-[#956084] hover:brightness-[0.98] active:scale-[0.99] sm:gap-4 sm:p-4"
                >
                  <div
                    className={`flex min-w-0 gap-3 sm:gap-4 ${
                      isExpanded ? "items-start" : "items-center"
                    }`}
                  >
                    <div className={ICON_BADGE}>
                      <Icon
                        size={24}
                        className="text-[#39265f] sm:h-7 sm:w-7"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <h3
                        className={`mb-1 ${CARD_TITLE} ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>

                      <p
                        className={`${CARD_TEXT} ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {item.message}
                      </p>

                      {isExpanded && item.office && (
                        <p className="mt-3 text-sm font-bold text-[#39265f]">
                          From: {item.office}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-right text-xs font-semibold text-[#39265f] sm:text-sm">
                      {timeAgo(item.created_at)}
                    </span>

                    <ChevronDown
                      size={18}
                      className={`text-[#6d5b7a] transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}