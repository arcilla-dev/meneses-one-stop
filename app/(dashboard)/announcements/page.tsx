"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
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
  created_at: string; // ISO timestamp — relative time ("2h ago") is derived from this
  announcement_type: string; // used to pick an icon
  office?: string; // issuing office, shown when an announcement is expanded
}

// Maps announcement_type to a lucide icon (same pattern as notifications/page.tsx).
const ICON_MAP: Record<string, React.ElementType> = {
  enrollment: FileSignature,
  infirmary: PlusSquare,
  scholarship: GraduationCap,
  printing: Users,
};

const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

// Shared control colors (same palette as the Requests page)
const CONTROL_IDLE = "bg-[#b477a1] text-white";
const CONTROL_ACTIVE =
  "bg-[#956084] text-white ring-2 ring-[#39265f]/40 ring-offset-2 ring-offset-[#ffd9e8]";

const timeAgo = (iso: string) => {
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
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

// --- Mock data (stand-in for a Supabase table named "announcements") ---
// Expected real columns: id, title, message, created_at, announcement_type, office
const buildMockAnnouncements = (): AnnouncementItem[] => {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
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
      message: "Make sure your registration details are complete before the enrollment period starts.",
      created_at: hoursAgo(26),
      announcement_type: "enrollment",
      office: "Registrar's Office",
    },
    {
      id: 4,
      title: "Scholarship Interview Schedule",
      message: "Shortlisted applicants will be notified of their interview schedules by email.",
      created_at: hoursAgo(28),
      announcement_type: "scholarship",
      office: "Scholarship Office",
    },
    {
      id: 5,
      title: "Scholarship Application Open",
      message: "Applications for the academic scholarship are now open until the end of the month.",
      created_at: hoursAgo(50),
      announcement_type: "scholarship",
      office: "Scholarship Office",
    },
    {
      id: 6,
      title: "LSC Printing Services Update",
      message: "Printing services at the LSC office are now available on weekdays from 8 AM to 5 PM.",
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
  const [expandedId, setExpandedId] = useState<AnnouncementItem["id"] | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
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

      // --- Mock version (remove once Supabase is wired up) ---
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
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === "Most recent" ? diff : -diff;
    });
  }, [announcements, query, sort]);

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Faded campus logo background */}
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
        {/* Header Section */}
        <div className="flex items-center gap-3 text-[#39265f] md:gap-4">
            <Image
              src="/icons/announcement-icon.png"
              alt="Notification"
              width={50}
              height={46}
              className="h-14 w-16 object-contain sm:h-15 sm:w-17"
            />
          <div>
            <h1
              className={`${delaGothicOne.className} text-2xl tracking-wide sm:text-3xl md:text-4xl xl:text-5xl`}
            >
              Announcements
            </h1>
            <p
              className="mt-1 text-xs tracking-wide text-[#6d5b7a] sm:text-sm md:tracking-widest"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Official announcements from different offices.
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-5 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-3 flex gap-1 text-[#39265f] md:mx-4">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Sort dropdown + Search toggle */}
        <div className="mb-4 flex items-center justify-between gap-4 md:mb-6">
          <div className="relative">
            <select
              aria-label="Sort announcements"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={`${delaGothicOne.className} appearance-none cursor-pointer rounded-xl py-3 pl-5 pr-12 text-xs shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39265f]/40 sm:text-sm ${CONTROL_ACTIVE}`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#f4e1eb] text-[#39265f]">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={20}
              strokeWidth={3}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white"
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
            className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm transition hover:brightness-105 active:scale-95 ${
              showSearch ? CONTROL_ACTIVE : CONTROL_IDLE
            }`}
          >
            <Search size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search input (revealed by the search button) */}
        {showSearch && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements..."
            autoFocus
            className="mb-4 w-full rounded-xl border border-[#c48ab2] bg-[#dfb5d1]/70 px-4 py-3 text-[#39265f] placeholder:text-[#5a4a75]/70 focus:border-[#956084] focus:outline-none md:mb-6"
          />
        )}

        {/* List Section */}
        {loading ? (
          <p className="py-8 text-center text-[#6d5b7a]">Loading announcements...</p>
        ) : visibleAnnouncements.length === 0 ? (
          <div className="rounded-xl border border-[#c48ab2] bg-[#dfb5d1]/70 px-4 py-10 text-center shadow-sm">
            <Megaphone
              size={40}
              className="mx-auto mb-3 text-[#956084]"
              strokeWidth={1.5}
            />
            <p
              className="text-lg font-bold text-[#39265f]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {query.trim() !== "" ? "No announcements match your search." : "No announcements yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-8 md:gap-4">
            {visibleAnnouncements.map((item) => {
              const Icon = getIconForType(item.announcement_type);
              const isExpanded = expandedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#c48ab2] bg-gradient-to-r from-[#dfb5d1]/90 via-[#d4a9c8]/85 to-[#a991b8]/85 p-3 text-left shadow-sm transition duration-200 hover:border-[#956084] hover:shadow-md active:scale-[0.99] sm:p-4 md:gap-5"
                >
                  {/* Left Side: Icon & Details */}
                  <div className={`flex min-w-0 gap-3 sm:gap-5 ${isExpanded ? "items-start" : "items-center"}`}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-[#b477a1] to-[#6d5b7a] shadow-inner sm:h-14 sm:w-14">
                      <Icon
                        size={25}
                        strokeWidth={1.8}
                        className="text-white sm:h-7 sm:w-7"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <h3
                        className={`mb-0.5 text-base font-bold text-[#39265f] sm:text-lg md:text-xl ${isExpanded ? "break-words" : "truncate"}`}
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className={`text-xs text-[#5a4a75] sm:text-sm ${isExpanded ? "" : "truncate"}`}>
                        {item.message}
                      </p>
                      {isExpanded && item.office && (
                        <p className="mt-2 text-xs font-bold text-[#39265f] sm:text-sm">From: {item.office}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Relative time */}
                  <span className={`shrink-0 text-xs font-bold text-[#39265f] sm:text-sm ${isExpanded ? "self-start" : ""}`}>
                    {timeAgo(item.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}