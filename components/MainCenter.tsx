"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  FileText,
  FileSignature,
  GraduationCap,
  PlusSquare,
  Users,
  UsersRound,
  ChevronDown,
} from "lucide-react";
import { Dela_Gothic_One, Great_Vibes } from "next/font/google";
import type { StudentProfile } from "@/contexts/UserProfileContext";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

interface MainCenterProps {
  studentProfile?: StudentProfile | null;
}

const pad = (n: number) => n.toString().padStart(2, "0");

/* ------------------------------------------------------------------ */
/*  Office buttons (each one redirects to its office page)             */
/* ------------------------------------------------------------------ */
// bg = optional background photo for the button (put the files in /public and change the paths).
// If a file doesn't exist yet, the button just shows its purple gradient.
const OFFICE_BUTTONS = [
  { key: "registrar", label: "Registrar", icon: FileSignature, href: "/studentview/offices/registrar", bg: "/icons/registrar-bg.png" },
  { key: "infirmary", label: "Infirmary", icon: PlusSquare, href: "/studentview/offices/infirmary", bg: "/icons/infirmary-bg.png" },
  { key: "scholarship", label: "Scholarship", icon: GraduationCap, href: "/studentview/offices/scholarship", bg: "/icons/scholarship-bg.png" },
  { key: "lsc", label: "LSC", icon: UsersRound, href: "/studentview/offices/localstudentcouncil", bg: "/icons/lsc-bg.png" },
];

/* ------------------------------------------------------------------ */
/*  Quick Access links                                                 */
/* ------------------------------------------------------------------ */
const QUICK_ACCESS = [
  { key: "requests", label: "My Requests", href: "/requests" },
  { key: "documents", label: "My Documents", href: "/documents" },
  { key: "schedules", label: "Schedules", href: "/schedules" },
];

/* ------------------------------------------------------------------ */
/*  Latest Announcements data                                          */
/* ------------------------------------------------------------------ */
interface AnnouncementItem {
  id: number | string;
  title: string;
  created_at: string; // ISO timestamp
  announcement_type: string; // used to pick an icon
}

const ICON_MAP: Record<string, React.ElementType> = {
  enrollment: FileSignature,
  infirmary: PlusSquare,
  scholarship: GraduationCap,
  printing: Users,
};

const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

// Mock data (same shape as the Announcements page). Replace with Supabase when ready.
const buildMockAnnouncements = (): AnnouncementItem[] => {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  return [
    { id: 1, title: "Enrollment Schedule for 2nd Semester 2026-2027", created_at: hoursAgo(2), announcement_type: "enrollment" },
    { id: 2, title: "Free Medical Check-up for BSU-MC Students", created_at: hoursAgo(4), announcement_type: "infirmary" },
    { id: 3, title: "Registration Reminder", created_at: hoursAgo(26), announcement_type: "enrollment" },
    { id: 4, title: "Scholarship Interview Schedule", created_at: hoursAgo(28), announcement_type: "scholarship" },
    { id: 5, title: "Scholarship Application Open", created_at: hoursAgo(50), announcement_type: "scholarship" },
    { id: 6, title: "LSC Printing Services Update", created_at: hoursAgo(52), announcement_type: "printing" },
  ];
};

async function fetchLatestAnnouncements(): Promise<AnnouncementItem[]> {
  // --- Supabase version (uncomment, then delete the mock block below) ---
  // const { data, error } = await supabase
  //   .from("announcements")
  //   .select("id, title, created_at, announcement_type")
  //   .order("created_at", { ascending: false })
  //   .limit(6);
  // if (error) throw error;
  // return data as AnnouncementItem[];

  // --- Mock version ---
  await new Promise((resolve) => setTimeout(resolve, 200));
  return buildMockAnnouncements();
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/* ------------------------------------------------------------------ */

const MainCenter = ({ studentProfile }: MainCenterProps) => {
  // null until the component mounts, so the server and browser render the same thing first
  const [now, setNow] = useState<Date | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchLatestAnnouncements();
        if (!cancelled) {
          const sorted = [...items].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setAnnouncements(sorted);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingAnnouncements(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Date: 2026 - 10 - 13
  const dateText = now
    ? `${now.getFullYear()} - ${pad(now.getMonth() + 1)} - ${pad(now.getDate())}`
    : "202_ - __ - __";

  // Time: 09 : 05 : 41 AM
  const hours24 = now?.getHours() ?? 0;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const timeText = now
    ? `${pad(hours12)} : ${pad(now.getMinutes())} : ${pad(now.getSeconds())} ${hours24 >= 12 ? "PM" : "AM"}`
    : "__ : __ : __ AM";

  // Greeting follows the time of day (shows MORNING until the clock is ready)
  const greeting = !now
    ? "GOOD MORNING"
    : hours24 < 12
      ? "GOOD MORNING"
      : hours24 < 18
        ? "GOOD AFTERNOON"
        : "GOOD EVENING";

  // Shared look for the date and time cards
  const cardClass =
    "flex items-center gap-5 rounded-xl border-2 border-[#d9a9c9]/70 p-4 shadow-lg " +
    "bg-[linear-gradient(90deg,rgba(68,55,96,0.75)_0%,rgba(68,55,96,0.75)_50%,rgba(43,9,20,0.75)_100%)]";

  const greetingName = studentProfile?.full_name
    ? studentProfile.full_name.trim().split(/\s+/).slice(0, 2).join(" ")
    : "Loading...";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 bg-[#fcdced]">

      {/* ============ TOP ROW: banner + date/time ============ */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* Banner Section */}
        <div className="flex-1 h-[220px] rounded-xl relative overflow-hidden shadow-xl flex flex-col items-center justify-center border-2 border-[#543b59]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url("/greeting-bg.png")',
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent mix-blend-multiply" />

          {/* Text is now left-aligned */}
          <div className="relative z-10 text-white text-left items-start w-full px-6 md:px-10 flex flex-col gap-2 drop-shadow-lg">

            <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-gray-200">
              Everything you need, in one place.
            </p>

            <h1 className={`${delaGothicOne.className} text-3xl md:text-5xl tracking-wide text-white mt-1`}>
              {greeting},{" "}
              <span
                className={`${greatVibes.className} font-normal capitalize ml-1 text-pink-100 text-[1.2em]`}
              >
                {greetingName}{studentProfile?.full_name ? "!" : ""}
              </span>
            </h1>

            <p className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-gray-300 mt-2">
              Welcome back to your dashboard
            </p>
          </div>
        </div>

        {/* Right Side Widgets */}
        <div className="flex flex-col gap-4 w-full xl:w-[320px] shrink-0">

          {/* Date */}
          <div className={cardClass}>
            <Calendar
              className="h-16.5 w-14 shrink-0"
              fill="#F8C8E2"
              stroke="#6B4F72"
              strokeWidth={1}
            />

            <div className="flex flex-col text-left" style={{ fontFamily: "Georgia, serif" }}>
              <span className="text-white font-black text-[20px] tracking-wide uppercase drop-shadow-sm">
                Today&apos;s Date
              </span>

              <span className="text-white text-lg tracking-[0.12em] mt-1 tabular-nums drop-shadow-sm">
                {dateText}
              </span>
            </div>
          </div>

          {/* Time */}
          <div className={cardClass}>
            <Clock
              className="h-16.5 w-14 shrink-0"
              fill="#F8C8E2"
              stroke="#6B4F72"
              strokeWidth={1}
            />

            <div className="flex flex-col text-left" style={{ fontFamily: "Georgia, serif" }}>
              <span className="text-white font-black text-[20px] tracking-wide uppercase drop-shadow-sm">
                Current Time
              </span>

              <span className="text-white text-lg tracking-[0.1em] mt-1 tabular-nums drop-shadow-sm">
                {timeText}
              </span>
            </div>
          </div>

        </div>
      </div>
            
{/* ============ OFFICE BUTTONS ============ */}
<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
  {OFFICE_BUTTONS.map((office) => {
    const Icon = office.icon;
    return (
      <Link
        key={office.key}
        href={office.href}
        className="group relative flex h-[110px] md:h-[130px] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-[#d9a9c9]/30 shadow-md transition hover:scale-[1.03] hover:shadow-lg active:scale-95"
      >
        {/* Photo at the back */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundImage: `url("${office.bg}")` }}
        />

        {/* Dark translucent purple tint (photo shows faintly through) */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(91,74,120,0.82)_0%,rgba(74,48,88,0.8)_55%,rgba(60,20,38,0.85)_100%)]" />

        {/* Icon in pink circle */}
        <div className="relative flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F8C8E2_0%,#C48AB2_100%)] shadow-md">
          <Icon size={26} strokeWidth={2.2} className="text-[#1f1030]" />
        </div>

        {/* Label */}
        <span
          className="relative text-lg md:text-xl font-bold text-white drop-shadow-lg"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {office.label}
        </span>
      </Link>
    );
  })}
</div>

      {/* ============ BOTTOM ROW: Latest Announcements + Quick Access ============ */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

        {/* Latest Announcements */}
        <section className="rounded-xl border border-[#d9a9c9]/60 bg-[linear-gradient(180deg,#F5DCEC_0%,#E8C4DC_100%)] p-4 shadow-md md:p-5">
          <h2 className={`${delaGothicOne.className} mb-3 text-center text-2xl tracking-wide text-[#443760] md:text-3xl`}>
            Latest Announcements
          </h2>

          {loadingAnnouncements ? (
            <p className="py-6 text-center text-[#6d5b7a]">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p className="py-6 text-center text-[#6d5b7a]">No announcements yet.</p>
          ) : (
            <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto pr-1">
              {announcements.map((item, index) => {
                const Icon = getIconForType(item.announcement_type);
                return (
                  <Link
                    key={item.id}
                    href="/announcements"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition hover:brightness-95 ${
                      index % 2 === 0 ? "bg-[#C48AB2]" : "bg-[#DDB3D0]"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] shadow-inner">
                      <Icon size={20} strokeWidth={1.8} className="text-white" />
                    </div>

                    <p
                      className="line-clamp-2 min-w-0 flex-1 text-sm font-bold text-[#39265f] md:text-base"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {item.title}
                    </p>

                    <span
                      className="shrink-0 self-end text-xs text-[#39265f] md:text-sm"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {formatDate(item.created_at)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* View all */}
          <Link
            href="/announcements"
            aria-label="View all announcements"
            className="mt-2 flex justify-center text-[#6d5b7a] transition hover:text-[#39265f]"
          >
            <ChevronDown size={28} strokeWidth={3} />
          </Link>
        </section>

        {/* Quick Access */}
        <section className="rounded-xl border border-[#d9a9c9]/40 bg-[linear-gradient(135deg,#5E4D7C_0%,#4E3D6B_100%)] p-5 shadow-md">
          <h2
            className="mb-4 text-xl font-bold text-white md:text-2xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Quick Access
          </h2>

          <div className="flex flex-col gap-4">
            {QUICK_ACCESS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="group flex items-center gap-4 transition hover:translate-x-1"
              >
                <FileText
                  size={34}
                  strokeWidth={1.5}
                  fill="#E7B7D6"
                  stroke="#5E4D7C"
                  className="shrink-0"
                />
                <span
                  className="flex-1 border-b border-white/70 pb-1 text-base text-white group-hover:border-white"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainCenter;