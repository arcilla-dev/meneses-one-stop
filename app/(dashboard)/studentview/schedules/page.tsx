"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dela_Gothic_One } from "next/font/google";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

interface ScheduleCardProps {
  title: string;
  department: string;
  date: string;
  days: string;
  time: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  department: string;
  date: string; // YYYY-MM-DD
  days: string;
  time: string;
}

/* A class from subjects + student_subjects. It repeats every week on `dayIdxs`. */
interface ClassSlot {
  code: string;
  title: string;
  dayIdxs: number[]; // 0 = Sun ... 6 = Sat
  time: string;
}

/* An appointment from the Infirmary (already filtered to the viewed month). */
interface AppointmentRow {
  id: string;
  service: string;
  date: string;
  time_start: string;
  time_end: string;
  status: string;
}

/* A scholarship deadline. */
interface DeadlineItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  title,
  department,
  date,
  days,
  time,
}) => {
  return (
    <div className="w-full rounded-lg border-2 border-[#956084] bg-[#dfb5d1]/80 p-3 shadow-sm md:p-4">
      <h3
        className="mb-1 text-lg font-bold text-[#39265f] md:text-xl"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {title}
      </h3>

      <div
        className="flex items-center justify-between gap-3 text-sm text-[#6d5b7a] md:text-base"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <span>{department}</span>
        <span>{days}</span>
      </div>

      <div
        className="flex items-center justify-between gap-3 text-sm text-[#6d5b7a] md:text-base"
        style={{ fontFamily: "Georgia, serif" }}
      >
        <span>{date}</span>
        <span>{time}</span>
      </div>
    </div>
  );
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (year: number, month0: number, day: number) =>
  `${year}-${pad(month0 + 1)}-${pad(day)}`;

/* "Thu" -> [4]; "Mon/Wed" -> [1, 3] */
const parseDayIdxs = (raw: string): number[] => {
  const found: number[] = [];
  for (const part of raw.toLowerCase().split(/[^a-z]+/)) {
    if (part.length < 3) continue;
    const idx = DAYS_OF_WEEK.findIndex((d) => d.toLowerCase() === part.slice(0, 3));
    if (idx >= 0 && !found.includes(idx)) found.push(idx);
  }
  return found;
};

/* "14:00:00" -> "2:00 PM" */
const formatClock = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

/* Accepts "2026-10-15", "2026-10-15T23:59:00", or any date text the browser can read. */
const parseDeadline = (raw: unknown): string | null => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
};

const weekdayOf = (iso: string) =>
  DAYS_OF_WEEK[new Date(`${iso}T00:00:00`).getDay()];

export default function MyScheduleMain() {
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassSlot[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [staticLoading, setStaticLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [draftMonth, setDraftMonth] = useState(today.getMonth());
  const [draftYear, setDraftYear] = useState(today.getFullYear());

  // Update today's date if the page stays open across midnight.
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const todayYear = currentDate.getFullYear();
  const todayMonth = currentDate.getMonth();
  const todayDay = currentDate.getDate();

  const firstDayOfWeek = useMemo(
    () => new Date(viewYear, viewMonth, 1).getDay(),
    [viewYear, viewMonth]
  );

  const daysInMonthCount = useMemo(
    () => new Date(viewYear, viewMonth + 1, 0).getDate(),
    [viewYear, viewMonth]
  );

  const emptyDays = Array(firstDayOfWeek).fill(null);

  const daysInMonth = Array.from(
    { length: daysInMonthCount },
    (_, index) => index + 1
  );

  const trailingFill =
    (7 - ((emptyDays.length + daysInMonth.length) % 7)) % 7;

  const goToPrevMonth = () => {
    setSelectedDate(null);

    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
    } else {
      setViewMonth((month) => month - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDate(null);

    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
    } else {
      setViewMonth((month) => month + 1);
    }
  };

  /* ---- loaded once: the student's classes and the scholarship deadlines ---- */
  useEffect(() => {
    let active = true;

    (async () => {
      const problems: string[] = [];
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");

        const [enrolled, scholarships] = await Promise.all([
          supabase
            .from("student_subjects")
            .select("status, subjects(code, title, day, time)")
            .eq("user_id", user.id)
            .eq("status", "enrolled"),
          supabase
            .from("scholarships")
            .select("id, name, data, is_active")
            .eq("is_active", true),
        ]);

        if (!active) return;

        if (enrolled.error) {
          problems.push("classes");
        } else {
          const rows = (enrolled.data ?? []) as unknown as Array<{
            subjects:
              | { code: string; title: string; day: string; time: string }
              | { code: string; title: string; day: string; time: string }[]
              | null;
          }>;
          const slots: ClassSlot[] = [];
          for (const row of rows) {
            const s = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
            if (!s) continue;
            const dayIdxs = parseDayIdxs(s.day);
            if (dayIdxs.length === 0) continue;
            slots.push({ code: s.code, title: s.title, dayIdxs, time: s.time });
          }
          setClasses(slots);
        }

        if (scholarships.error) {
          problems.push("scholarship deadlines");
        } else {
          const list: DeadlineItem[] = [];
          for (const sch of scholarships.data ?? []) {
            const date = parseDeadline((sch.data as { deadline?: unknown } | null)?.deadline);
            if (date) list.push({ id: sch.id, name: sch.name, date });
          }
          setDeadlines(list);
        }
      } catch (e) {
        console.error(e);
        problems.push("your schedule");
      } finally {
        if (active) {
          if (problems.length > 0) setError(`Could not load ${problems.join(" and ")}.`);
          setStaticLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  /* ---- reloaded whenever the month changes: Infirmary appointments ---- */
  useEffect(() => {
    let active = true;

    (async () => {
      setMonthLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");

        const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
        const { data, error: apptErr } = await supabase
          .from("appointments")
          .select("id, service, date, time_start, time_end, status")
          .eq("user_id", user.id)
          .in("status", ["pending", "approved", "completed"])
          .gte("date", toIso(viewYear, viewMonth, 1))
          .lte("date", toIso(viewYear, viewMonth, lastDay))
          .order("date", { ascending: true });

        if (!active) return;
        if (apptErr) {
          console.error(apptErr.message);
          setAppointments([]);
          setError("Could not load your appointments.");
        } else {
          setAppointments((data ?? []) as AppointmentRow[]);
        }
      } catch (e) {
        console.error(e);
        if (active) setAppointments([]);
      } finally {
        if (active) setMonthLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [viewYear, viewMonth]);

  const loading = staticLoading || monthLoading;

  /* ---- everything that happens in the viewed month, merged and sorted ---- */
  const schedules = useMemo<ScheduleItem[]>(() => {
    const items: ScheduleItem[] = [];
    const monthPrefix = `${viewYear}-${pad(viewMonth + 1)}`;

    for (const a of appointments) {
      items.push({
        id: `apt-${a.id}`,
        title: a.status === "pending" ? `${a.service} (Pending)` : a.service,
        department: "Infirmary",
        date: a.date,
        days: weekdayOf(a.date),
        time: `${formatClock(a.time_start)} - ${formatClock(a.time_end)}`,
      });
    }

    // Classes repeat every week on their day(s).
    for (let day = 1; day <= daysInMonthCount; day++) {
      const dow = new Date(viewYear, viewMonth, day).getDay();
      for (const c of classes) {
        if (!c.dayIdxs.includes(dow)) continue;
        items.push({
          id: `cls-${c.code}-${day}`,
          title: `${c.code} - ${c.title}`,
          department: "Class",
          date: toIso(viewYear, viewMonth, day),
          days: DAYS_OF_WEEK[dow],
          time: c.time,
        });
      }
    }

    for (const d of deadlines) {
      if (!d.date.startsWith(monthPrefix)) continue;
      items.push({
        id: `sch-${d.id}`,
        title: `${d.name} Deadline`,
        department: "Scholarship",
        date: d.date,
        days: weekdayOf(d.date),
        time: "All day",
      });
    }

    items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    return items;
  }, [appointments, classes, deadlines, viewYear, viewMonth, daysInMonthCount]);

  const datesWithSchedules = useMemo(
    () => new Set(schedules.map((schedule) => schedule.date)),
    [schedules]
  );

  const visibleSchedules = selectedDate
    ? schedules.filter((schedule) => schedule.date === selectedDate)
    : schedules;

  const formatDisplayDate = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto p-4 md:p-8">
      {/* Background logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 h-0"
      >
       <div className="absolute left-0 top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <img
            src="/icons/sched-bg.png"
            alt=""
            className="h-[90vh] w-auto max-w-none -translate-y-[4%] select-none opacity-25"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 text-[#39265f]">
            <Image
              src="/icons/schedule-icon.png"
              alt="Notification"
              width={45}
              height={45}
              className="h-13 w-13 object-contain sm:h-14 sm:w-14"
            />

          <div>
            <h1
              className={`${delaGothicOne.className} text-3xl tracking-wide md:text-5xl`}
            >
              My Schedule
            </h1>

            <p
              className="mt-1 text-sm tracking-widest text-[#6d5b7a]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              View and manage your schedule
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

        {/* Calendar controls */}
        <div className="mb-4 flex items-center justify-center gap-2 md:mb-5 md:gap-3">
          <button
            type="button"
            onClick={goToPrevMonth}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center text-[#6d5b7a] transition-colors hover:text-[#39265f]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDraftMonth(viewMonth);
                setDraftYear(viewYear);
                setShowMonthPicker((open) => !open);
              }}
              aria-expanded={showMonthPicker}
              aria-label="Choose month and year"
              className={`${delaGothicOne.className} min-w-[190px] rounded-lg border border-[#956084] bg-[#956084] px-5 py-2 text-center text-xs tracking-wide text-white shadow-sm transition-colors hover:bg-[#80506f] md:min-w-[250px] md:px-10 md:text-sm`}
            >
              {MONTH_NAMES[viewMonth].toUpperCase()} {viewYear} ▾
            </button>

            {showMonthPicker && (
              <div className="absolute left-1/2 top-full z-30 mt-2 w-[280px] -translate-x-1/2 rounded-xl border border-[#956084] bg-[#fff0f6] p-4 shadow-lg">
                <p
                  className={`${delaGothicOne.className} mb-3 text-center text-sm text-[#39265f]`}
                >
                  Select Month and Year
                </p>

                <label
                  className="mb-1 block text-sm text-[#39265f]"
                  htmlFor="schedule-month"
                >
                  Month
                </label>

                <select
                  id="schedule-month"
                  value={draftMonth}
                  onChange={(event) =>
                    setDraftMonth(Number(event.target.value))
                  }
                  className="mb-3 w-full rounded-md border border-[#c48ab2] bg-white px-3 py-2 text-[#39265f] outline-none focus:ring-2 focus:ring-[#956084]"
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>

                <label
                  className="mb-1 block text-sm text-[#39265f]"
                  htmlFor="schedule-year"
                >
                  Year
                </label>

                <select
                  id="schedule-year"
                  value={draftYear}
                  onChange={(event) =>
                    setDraftYear(Number(event.target.value))
                  }
                  className="mb-4 w-full rounded-md border border-[#c48ab2] bg-white px-3 py-2 text-[#39265f] outline-none focus:ring-2 focus:ring-[#956084]"
                >
                  {Array.from(
                    { length: 21 },
                    (_, index) => today.getFullYear() - 10 + index
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMonthPicker(false)}
                    className="flex-1 rounded-md border border-[#956084] px-3 py-2 text-sm text-[#39265f] hover:bg-[#f4dce9]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMonth(draftMonth);
                      setViewYear(draftYear);
                      setSelectedDate(null);
                      setShowMonthPicker(false);
                    }}
                    className="flex-1 rounded-md bg-[#956084] px-3 py-2 text-sm font-semibold text-white hover:bg-[#80506f]"
                  >
                    View Month
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center text-[#6d5b7a] transition-colors hover:text-[#39265f]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {error && (
          <p className="mx-auto mb-3 max-w-3xl text-center text-sm text-[#671410]">{error}</p>
        )}

        {/* Calendar */}
        <div className="mx-auto mb-5 w-full max-w-3xl overflow-hidden rounded-sm border-2 border-[#c48ab2] bg-[#dfb5d1]/80 shadow-sm md:mb-8">
          <div className="grid grid-cols-7 border-b border-[#cbaebd] text-center">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className={`${delaGothicOne.className} border-r border-[#cbaebd] bg-[#e8c4da]/90 py-2 text-xs text-[#39265f] last:border-r-0 md:py-3 md:text-base`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center">
            {emptyDays.map((_, index) => (
              <div
                key={`empty-${index}`}
                className="h-12 border-b border-r border-[#cbaebd] bg-white/10 md:h-[58px]"
              />
            ))}

            {daysInMonth.map((day) => {
              const iso = toIso(viewYear, viewMonth, day);
              const isSelected = selectedDate === iso;
              const isToday =
                todayYear === viewYear &&
                todayMonth === viewMonth &&
                todayDay === day;
              const hasSchedule = datesWithSchedules.has(iso);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setSelectedDate(isSelected ? null : iso)
                  }
                  aria-label={`${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}${isToday ? ", today" : ""}${hasSchedule ? ", has schedule" : ""}`}
                  aria-pressed={isSelected}
                  className="relative flex h-12 flex-col items-center justify-center border-b border-r border-[#cbaebd] bg-[#fbe6f0]/75 text-base text-[#39265f] transition-colors hover:bg-[#f4e1ea] md:h-[58px] md:text-lg"
                >
                  <span className="relative flex h-9 w-9 items-center justify-center md:h-10 md:w-10">
                    <span
                      className={`relative z-10 flex h-full w-full items-center justify-center ${
                        isSelected
                          ? "rounded-full border-2 border-[#956084] bg-[#c48ab2]/20"
                          : ""
                      }`}
                    >
                      {day}
                    </span>
                  </span>

                  {hasSchedule && (
                    <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-[#956084]" />
                  )}
                </button>
              );
            })}

            {Array(trailingFill)
              .fill(null)
              .map((_, index) => (
                <div
                  key={`fill-${index}`}
                  className="h-12 border-b border-r border-[#cbaebd] md:h-[58px]"
                />
              ))}
          </div>
        </div>

        {/* Schedule filter */}
        {selectedDate && (
          <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#39265f]">
              Showing: {formatDisplayDate(selectedDate)}
            </p>

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs text-[#6d5b7a] underline hover:text-[#39265f]"
            >
              Show all this month
            </button>
          </div>
        )}

        {/* Schedule cards */}
        {loading ? (
          <p className="py-8 text-center text-[#6d5b7a]">
            Loading schedule...
          </p>
        ) : visibleSchedules.length === 0 ? (
          <p className="py-8 text-center text-[#6d5b7a]">
            No schedule items{" "}
            {selectedDate ? "for this day" : "this month"}.
          </p>
        ) : (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 pb-8 md:grid-cols-2 md:gap-5">
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