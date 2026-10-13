"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";
type Tab = "Today" | "Upcoming" | "Completed" | "Cancelled";

const TABS: Tab[] = ["Today", "Upcoming", "Completed", "Cancelled"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Appointment {
  id: number | string;
  date: string; // "YYYY-MM-DD"
  start: string; // "HH:MM" (24h)
  end: string; // "HH:MM" (24h)
  service: string;
  student_name: string;
  program_year_section: string;
  status: AppointmentStatus;
}

type Row = { kind: "appt"; appt: Appointment } | { kind: "break" };

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Scheduled: "bg-[#a686b3] text-white",
  Completed: "bg-[#2e9e4f] text-white",
  Cancelled: "bg-[#ff2d2d] text-white",
};

const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

const serif = { fontFamily: "Georgia, serif" } as const;

/* ------------------------------ Date helpers ------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// "13:00" -> "01:00" (the wireframe shows a 12-hour clock without AM/PM)
const formatClock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${pad(h % 12 || 12)}:${pad(m)}`;
};
const formatRange = (a: Appointment) => `${formatClock(a.start)} - ${formatClock(a.end)}`;

const formatShortDate = (key: string) =>
  parseKey(key).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

const formatLongDate = (key: string) =>
  parseKey(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const byTime = (a: Appointment, b: Appointment) => a.start.localeCompare(b.start);
const byDateThenTime = (a: Appointment, b: Appointment) => a.date.localeCompare(b.date) || byTime(a, b);

/* -------------------------------- Mock data -------------------------------- */

// --- Mock data (stand-in for a Supabase table named "appointments") ---
// Expected real columns: id, date, start, end, service, student_name, program_year_section, status
// Generated around today's date so every tab has something to show.
const SLOTS = [
  { start: "08:00", end: "09:00", service: "Medical Consultation", student: "Josh Nathaniel R. Arcilla" },
  { start: "09:00", end: "09:30", service: "Vital Signs Check", student: "Hazel Rose V. de Guzman" },
  { start: "09:30", end: "10:30", service: "Dental Check-up", student: "Cloiez Veniz L. Belmonte" },
  { start: "10:30", end: "11:00", service: "Medical Certificate", student: "Jerome S. Lagarde" },
  { start: "11:00", end: "12:00", service: "Other Infirmary Requests", student: "Jerome S. Lagarde" },
  { start: "13:00", end: "14:00", service: "Medical Certificate", student: "Cloiez Veniz L. Belmonte" },
];

const buildMockAppointments = (now: Date): Appointment[] => {
  const result: Appointment[] = [];
  let id = 1;
  for (let n = -45; n <= 45; n++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);
    if (day.getDay() === 0 || day.getDay() === 6) continue; // infirmary is closed on weekends

    SLOTS.forEach((slot, s) => {
      // Today keeps the full schedule from the wireframe; other days drop a slot or two.
      if (n !== 0 && (s + Math.abs(n)) % 5 === 0) return;

      const [eh, em] = slot.end.split(":").map(Number);
      const endsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eh, em);
      let status: AppointmentStatus = endsAt <= now ? "Completed" : "Scheduled";
      if (n !== 0 && (n * 7 + s) % 11 === 0) status = "Cancelled";

      result.push({
        id: id++,
        date: toKey(day),
        start: slot.start,
        end: slot.end,
        service: slot.service,
        student_name: slot.student,
        program_year_section: "BSCpE - 4B",
        status,
      });
    });
  }
  return result;
};

/* ---------------------------------- Page ---------------------------------- */

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayKey, setTodayKey] = useState("");
  const [month, setMonth] = useState<{ year: number; month: number } | null>(null);
  const [tab, setTab] = useState<Tab>("Today");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      const now = new Date();

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
      // const { data, error } = await supabase
      //   .from("appointments")
      //   .select("*")
      //   .order("date", { ascending: true })
      //   .order("start", { ascending: true });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setAppointments(data as Appointment[]);
      // }

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 200));
      setAppointments(buildMockAppointments(now));

      // Set after mount so the server and browser never disagree about "today".
      setTodayKey(toKey(now));
      setMonth({ year: now.getFullYear(), month: now.getMonth() });
      setLoading(false);
    };

    loadAppointments();
  }, []);

  // Number of active (not cancelled) appointments per day, for the dots on the calendar.
  const activeByDate = useMemo(() => {
    const map: Record<string, number> = {};
    appointments.forEach((a) => {
      if (a.status !== "Cancelled") map[a.date] = (map[a.date] ?? 0) + 1;
    });
    return map;
  }, [appointments]);

  const dayMode = selectedDate !== null || tab === "Today";
  const showStatus = selectedDate !== null;
  const showDate = !dayMode;

  const rows: Row[] = useMemo(() => {
    if (loading) return [];
    let list: Appointment[];
    if (selectedDate) {
      list = appointments.filter((a) => a.date === selectedDate).sort(byTime);
    } else if (tab === "Today") {
      list = appointments.filter((a) => a.date === todayKey && a.status !== "Cancelled").sort(byTime);
    } else if (tab === "Upcoming") {
      list = appointments.filter((a) => a.date > todayKey && a.status === "Scheduled").sort(byDateThenTime);
    } else if (tab === "Completed") {
      list = appointments.filter((a) => a.status === "Completed").sort((a, b) => byDateThenTime(b, a));
    } else {
      list = appointments.filter((a) => a.status === "Cancelled").sort((a, b) => byDateThenTime(b, a));
    }

    const result: Row[] = list.map((appt) => ({ kind: "appt", appt }));
    if (dayMode && list.length > 0) {
      // The lunch break sits before the first afternoon appointment (or at the end).
      const firstPm = list.findIndex((a) => a.start >= "12:00");
      result.splice(firstPm === -1 ? result.length : firstPm, 0, { kind: "break" });
    }
    return result;
  }, [loading, appointments, selectedDate, tab, todayKey, dayMode]);

  const appointmentCount = rows.filter((r) => r.kind === "appt").length;

  // Calendar cells for the visible month: leading blanks, the days, trailing blanks.
  const cells = useMemo(() => {
    if (!month) return [];
    const lead = new Date(month.year, month.month, 1).getDay();
    const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
    const out: (number | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month]);

  const shiftMonth = (delta: number) =>
    setMonth((m) => {
      if (!m) return m;
      const d = new Date(m.year, m.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const monthLabel = month
    ? new Date(month.year, month.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const handleTab = (next: Tab) => {
    setTab(next);
    setSelectedDate(null);
    if (next === "Today") {
      const t = parseKey(todayKey);
      setMonth({ year: t.getFullYear(), month: t.getMonth() });
    }
  };

  // Clicking the selected date again goes back to the tab view.
  const handleDateClick = (key: string) => setSelectedDate((prev) => (prev === key ? null : key));

  const headers = [
    ...(showDate ? ["Date"] : []),
    "Time",
    "Service",
    "Student Name",
    "Program/Yr/Sec",
    ...(showStatus ? ["Status"] : []),
  ];

  const emptyMessage = selectedDate
    ? "No appointments on this day."
    : tab === "Today"
      ? "No appointments scheduled for today."
      : `No ${tab.toLowerCase()} appointments.`;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 text-[#402A5D]">
          <CalendarDays size={48} strokeWidth={1.5} />
          <div>
            <h1 className="text-5xl font-semibold tracking-wide" style={serif}>
              Appointments
            </h1>
            <p className="text-sm text-[#5a4a75] mt-1" style={serif}>
              View and manage your appointments
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full" />
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]" />
            <span className="w-4 h-2 rounded-full bg-[#39265f]" />
            <span className="w-2 h-2 rounded-full bg-[#39265f]" />
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full" />
        </div>

        {loading || !month ? (
          <p className="text-center text-[#5a4a75] py-8">Loading appointments...</p>
        ) : (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                className="p-1 rounded text-[#8a5a7e] hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
              >
                <ChevronLeft size={28} strokeWidth={3} />
              </button>
              <h2
                aria-live="polite"
                className="min-w-[200px] text-center px-8 py-1.5 rounded-md bg-[#b07aa1] text-white text-sm font-bold uppercase tracking-wide"
              >
                {monthLabel}
              </h2>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                className="p-1 rounded text-[#8a5a7e] hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0]"
              >
                <ChevronRight size={28} strokeWidth={3} />
              </button>
            </div>

            {/* Calendar */}
            <div className="max-w-xl mx-auto">
              <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="py-1.5 text-center text-sm font-bold text-[#5a3a6e] bg-[#f4c8da] border border-[#a8668f]/70 rounded-sm"
                    style={serif}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((day, i) => {
                  if (day === null) {
                    return <div key={`blank-${i}`} className="h-11 rounded-sm bg-[#fbd9e6]/60 border border-[#a8668f]/40" />;
                  }
                  const key = `${month.year}-${pad(month.month + 1)}-${pad(day)}`;
                  const count = activeByDate[key] ?? 0;
                  const isSelected = selectedDate === key;
                  const isToday = key === todayKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isSelected}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={`${formatLongDate(key)}, ${count} appointment${count === 1 ? "" : "s"}`}
                      onClick={() => handleDateClick(key)}
                      className={`relative h-11 rounded-sm border text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9b51e0] ${
                        isSelected
                          ? "bg-[#b07aa1] text-white border-[#8a5a7e]"
                          : "bg-[#fbd9e6] text-[#5a3a6e] border-[#a8668f]/70 hover:bg-[#f4c2d9]"
                      } ${isToday ? "ring-2 ring-[#39265f] ring-offset-1 ring-offset-[#FEEAEE]" : ""}`}
                      style={serif}
                    >
                      {day}
                      {count > 0 && (
                        <span
                          aria-hidden="true"
                          className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-[#39265f]"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 mb-4">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={selectedDate === null && tab === t}
                  onClick={() => handleTab(t)}
                  className={`py-1.5 rounded-full text-sm font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                    selectedDate === null && tab === t ? TAB_ACTIVE : TAB_INACTIVE
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Selected date summary */}
            {selectedDate && (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[#39265f]">
                <p style={serif}>
                  <span className="font-bold">{formatLongDate(selectedDate)}</span>
                  <span className="text-[#5a4a75]">
                    {" "}
                    &mdash; {appointmentCount} appointment{appointmentCount === 1 ? "" : "s"}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="px-4 py-1 rounded-full bg-[#8a5a7e] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
                >
                  Clear date
                </button>
              </div>
            )}

            {/* Schedule table */}
            <section className="rounded-xl bg-[#d8abca] p-3 md:p-4 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
              {rows.length === 0 ? (
                <p className="text-center text-[#5a4a75] py-8">{emptyMessage}</p>
              ) : (
                <div className="max-h-[40vh] overflow-auto">
                  <table className="w-full min-w-[560px] border-separate border-spacing-[2px] text-sm text-[#39265f]">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        {headers.map((h) => (
                          <th key={h} className="bg-[#b07aa1] text-white font-bold px-3 py-2 text-center" style={serif}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        if (row.kind === "break") {
                          return (
                            <tr key="lunch-break" className="bg-[#f4e1eb]">
                              <td className="px-3 py-2 text-center">Lunch Break</td>
                              <td className="px-3 py-2 text-center">----</td>
                              <td className="px-3 py-2 text-center">----</td>
                              <td className="px-3 py-2 text-center">----</td>
                              {showStatus && <td className="px-3 py-2 text-center">----</td>}
                            </tr>
                          );
                        }
                        const a = row.appt;
                        // On the Today tab, appointments that already happened are muted.
                        const muted = !showStatus && tab === "Today" && a.status === "Completed";
                        return (
                          <tr key={a.id} className={`bg-[#f4e1eb] ${muted ? "opacity-60" : ""}`}>
                            {showDate && <td className="px-3 py-2 text-center">{formatShortDate(a.date)}</td>}
                            <td className="px-3 py-2 text-center whitespace-nowrap">{formatRange(a)}</td>
                            <td className="px-3 py-2">{a.service}</td>
                            <td className="px-3 py-2">{a.student_name}</td>
                            <td className="px-3 py-2 text-center">{a.program_year_section}</td>
                            {showStatus && (
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`inline-block min-w-[84px] px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[a.status]}`}
                                >
                                  {a.status}
                                </span>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
