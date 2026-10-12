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
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

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

// Shared control colors (same palette as notifications/page.tsx)
const CONTROL_IDLE = "bg-[#D8ABCA] text-white";
const CONTROL_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

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
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-4 text-[#402A5D]">
          <Megaphone size={48} strokeWidth={1.5} className="fill-[#402A5D] text-[#402A5D]" />
          <div>
            <h1 className="text-5xl font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              Announcements
            </h1>
            <p className="text-sm text-[#5a4a75] mt-1" style={{ fontFamily: "Georgia, serif" }}>
              Official announcements from different offices.
            </p>
          </div>
        </div>

        {/* Decorative Divider (same as notifications) */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-4 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
        </div>

        {/* Sort dropdown + Search toggle */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative">
            <select
              aria-label="Sort announcements"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={`appearance-none cursor-pointer py-2 pl-5 pr-12 rounded-lg font-bold text-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39265f]/40 ${CONTROL_ACTIVE}`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-[#39265f] bg-[#f4e1eb]">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              size={22}
              strokeWidth={3}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#39265f]"
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
            className={`shrink-0 w-14 h-10 flex items-center justify-center rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 ${
              showSearch ? CONTROL_ACTIVE : CONTROL_IDLE
            }`}
          >
            <Search size={24} strokeWidth={2.5} />
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
            className="w-full mb-4 px-4 py-3 rounded-xl bg-[#f4e1eb] border border-[#d3bbcc] text-[#39265f] placeholder:text-[#5a4a75]/70 focus:outline-none focus:border-[#9b51e0]"
          />
        )}

        {/* Thin rule between controls and list */}
        <div className="h-px bg-[#39265f]/40 mb-4 mx-4" />

        {/* List Section */}
        {loading ? (
          <p className="text-center text-[#5a4a75] py-8">Loading announcements...</p>
        ) : visibleAnnouncements.length === 0 ? (
          <p className="text-center text-[#5a4a75] py-8">
            {query.trim() !== "" ? "No announcements match your search." : "No announcements yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {visibleAnnouncements.map((item) => {
              const Icon = getIconForType(item.announcement_type);
              const isExpanded = expandedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-left flex items-center justify-between gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:border-[#9b51e0] bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] border border-[#d3bbcc]"
                >
                  {/* Left Side: Icon & Details */}
                  <div className={`flex gap-5 min-w-0 ${isExpanded ? "items-start" : "items-center"}`}>
                    <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] flex items-center justify-center shadow-inner">
                      <Icon size={28} className="text-[#e2d5e3]" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <h3
                        className={`text-[1.15rem] font-bold text-[#39265f] mb-0.5 ${isExpanded ? "" : "truncate"}`}
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className={`text-sm text-[#5a4a75] ${isExpanded ? "" : "truncate"}`}>{item.message}</p>
                      {isExpanded && item.office && (
                        <p className="text-sm font-bold text-[#39265f] mt-2">From: {item.office}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Relative time */}
                  <span className={`shrink-0 text-sm font-bold text-[#39265f] ${isExpanded ? "self-start" : ""}`}>
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
