"use client";

import React, { useState, useEffect, useMemo } from "react";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

interface ScheduleCardProps {
  title: string;
  department: string;
  date: string;
  days: string;
  time: string;
}

interface ScheduleItem {
  id: number | string;
  title: string;
  department: string;
  date: string; // ISO format "YYYY-MM-DD", used for calendar matching
  days: string;
  time: string;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ title, department, date, days, time }) => {
  return (
    <div className="bg-[#ebd5df] border border-[#d2b1c2] rounded-md p-4 shadow-sm w-full">
      <h3 className="text-[#3b214f] font-bold text-lg mb-2">{title}</h3>
      <div className="flex justify-between items-center text-sm text-[#4b3561]">
        <span>{department}</span>
        <span>{days}</span>
      </div>
      <div className="flex justify-between items-center text-sm text-[#4b3561]">
        <span>{date}</span>
        <span>{time}</span>
      </div>
    </div>
  );
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// --- Mock data (stand-in for a Supabase "schedules" table) ---
// Expected real columns: id, title, department, date (date type), days, time, student_id (nullable — null = visible to all)
const MOCK_SCHEDULES: ScheduleItem[] = [
  { id: 1, title: "COR Release Date (Starts at)", department: "Registrar", date: "2026-10-05", days: "Mon-Fri", time: "08:00 - 05:00" },
  { id: 2, title: "Medical Consultation", department: "Infirmary", date: "2026-10-05", days: "Mon", time: "09:30 - 10:30 AM" },
  { id: 3, title: "Claim Printed Documents", department: "Registrar", date: "2026-10-08", days: "Thu", time: "01:00 - 04:00 PM" },
  { id: 4, title: "Scholarship Deadlines", department: "Admin Office", date: "2026-10-15", days: "Thu", time: "11:59 PM" },
  { id: 5, title: "Library Book Return Deadline", department: "Library", date: "2026-10-20", days: "Tue", time: "05:00 PM" },
  { id: 6, title: "Clinic Vaccination Drive", department: "Infirmary", date: "2026-10-22", days: "Thu", time: "08:00 AM - 12:00 PM" },
];

export default function MyScheduleMain() {
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const firstDayOfWeek = useMemo(() => new Date(viewYear, viewMonth, 1).getDay(), [viewYear, viewMonth]);
  const daysInMonthCount = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewYear, viewMonth]);

  const emptyDays = Array(firstDayOfWeek).fill(null);
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);
  const trailingFill = (7 - ((emptyDays.length + daysInMonth.length) % 7)) % 7;

  const toIsoDate = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const startOfMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
      // const endOfMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${daysInMonthCount}`;
      // const { data: { user } } = await supabase.auth.getUser();
      // const { data, error } = await supabase
      //   .from("schedules")
      //   .select("*")
      //   .gte("date", startOfMonth)
      //   .lte("date", endOfMonth)
      //   .or(`student_id.eq.${user?.id},student_id.is.null`)
      //   .order("date", { ascending: true });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setSchedules(data as ScheduleItem[]);
      // }

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 150));
      setSchedules(
        MOCK_SCHEDULES.filter((s) => s.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`))
      );

      setLoading(false);
    };

    loadSchedules();
  }, [viewYear, viewMonth, daysInMonthCount]);

  const datesWithSchedules = useMemo(() => new Set(schedules.map((s) => s.date)), [schedules]);

  const visibleSchedules = selectedDate ? schedules.filter((s) => s.date === selectedDate) : schedules;

  const formatDisplayDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  return (
    // Same scrollable-content pattern as the Requests page: flex-1 + h-full + overflow-y-auto
    // lets THIS page scroll internally inside the dashboard's fixed-height <main>, instead of
    // the old overflow-hidden which silently blocked scrolling when content got tall.
    <div className="flex-1 h-full min-h-screen bg-[#fcf2f6] p-6 md:p-10 font-sans overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header Section — same icon sizing/style as My Requests for consistency */}
        <div className="flex items-center gap-4 text-[#3b214f]">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M6 14h12" />
            <path d="M8 14v4" />
            <path d="M16 14v4" />
            <path d="M5 18h14" />
            <path d="M19 14a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2z" />
            <path d="M7 12V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v5" />
          </svg>
          <div>
            <h1 className="text-5xl font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              My Schedule
            </h1>
            <p className="text-[#654e7a] text-sm tracking-widest mt-1">View and manage your schedule</p>
          </div>
        </div>

        {/* Decorative Divider — matches My Requests */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#3b214f] flex-1 rounded-full"></div>
          <div className="mx-4 text-[#3b214f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3b214f]"></span>
            <span className="w-4 h-2 rounded-full bg-[#3b214f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#3b214f]"></span>
          </div>
          <div className="h-[2px] bg-[#3b214f] flex-1 rounded-full"></div>
        </div>

        {/* Calendar Controls */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <button
            onClick={goToPrevMonth}
            aria-label="Previous month"
            className="w-8 h-8 flex items-center justify-center text-[#654e7a] hover:text-[#3b214f] transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="bg-[#c293a9] text-white px-10 py-2 rounded-full font-bold text-sm tracking-widest shadow-sm">
            {MONTH_NAMES[viewMonth].toUpperCase()} {viewYear}
          </div>

          <button
            onClick={goToNextMonth}
            aria-label="Next month"
            className="w-8 h-8 flex items-center justify-center text-[#654e7a] hover:text-[#3b214f] transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-[#fcf2f6] border border-[#d2b1c2] rounded-sm max-w-3xl mx-auto mb-8 shadow-sm">
          <div className="grid grid-cols-7 text-center border-b border-[#d2b1c2]">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-3 font-semibold text-[#3b214f] border-r border-[#d2b1c2] last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="h-14 border-r border-b border-[#d2b1c2] last:border-r-0"></div>
            ))}

            {daysInMonth.map((day) => {
              const iso = toIsoDate(day);
              const isSelected = selectedDate === iso;
              const hasSchedule = datesWithSchedules.has(iso);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : iso)}
                  className="h-14 flex flex-col items-center justify-center border-r border-b border-[#d2b1c2] text-[#553b6b] text-lg last:border-r-0 relative hover:bg-[#f4e1ea] transition-colors"
                >
                  <span
                    className={`flex items-center justify-center w-10 h-10 ${
                      isSelected ? "border-2 border-[#3b214f] rounded-full" : ""
                    }`}
                  >
                    {day}
                  </span>
                  {hasSchedule && <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#c293a9]"></span>}
                </button>
              );
            })}

            {Array(trailingFill)
              .fill(null)
              .map((_, index) => (
                <div key={`fill-${index}`} className="h-14 border-r border-[#d2b1c2] last:border-r-0"></div>
              ))}
          </div>
        </div>

        {/* Schedule Cards Section */}
        {selectedDate && (
          <div className="flex items-center justify-between max-w-3xl mx-auto mb-3">
            <p className="text-[#3b214f] font-semibold text-sm">Showing: {formatDisplayDate(selectedDate)}</p>
            <button onClick={() => setSelectedDate(null)} className="text-xs text-[#654e7a] hover:text-[#3b214f] underline">
              Show all this month
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-center text-[#654e7a] py-8">Loading schedule...</p>
        ) : visibleSchedules.length === 0 ? (
          <p className="text-center text-[#654e7a] py-8">
            No schedule items {selectedDate ? "for this day" : "this month"}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto pb-8">
            {visibleSchedules.map((item) => (
              <ScheduleCard
                key={item.id}
                title={item.title}
                department={item.department}
                date={formatDisplayDate(item.date)}
                days={item.days}
                time={item.time}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}