"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { Dela_Gothic_One, Great_Vibes } from "next/font/google";
import RequestStatCards from "@/components/admin/RequestStatCards";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

const pad = (n: number) => n.toString().padStart(2, "0");

// Shared look for the date and time cards
const cardClass =
  "flex items-center gap-5 rounded-xl border-2 border-[#d9a9c9]/70 p-4 shadow-lg " +
  "bg-[linear-gradient(90deg,rgba(68,55,96,0.75)_0%,rgba(68,55,96,0.75)_50%,rgba(43,9,20,0.75)_100%)]";

export default function AdminPage() {
  // null until the component mounts, so the server and browser render the same thing first
  const [now, setNow] = useState<Date | null>(null);
  // undefined = still loading, null = no name on the profile
  const [adminName, setAdminName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // The admin's own row in public.profiles (staff can read it through the "Staff read profiles" policy)
  useEffect(() => {
    let cancelled = false;

    const loadAdminName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setAdminName(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (error) console.error(error.message);
      if (!cancelled) setAdminName(data?.full_name?.trim() || null);
    };

    loadAdminName();
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

  const greetingName =
    adminName === undefined
      ? "Loading..."
      : adminName
        ? adminName.split(/\s+/).slice(0, 2).join(" ")
        : "Admin";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 bg-[#fcdced]">
      {/* Top row: banner + date/time */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Banner Section */}
        <div className="flex-1 h-[220px] rounded-xl relative overflow-hidden shadow-xl flex flex-col items-center justify-center border-2 border-[#543b59]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/greeting-bg.png")' }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent mix-blend-multiply" />

          <div className="relative z-10 text-white text-left items-start w-full px-6 md:px-10 flex flex-col gap-2 drop-shadow-lg">
            <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-gray-200">
              Everything you need, in one place.
            </p>

            <h1 className={`${delaGothicOne.className} text-3xl md:text-5xl tracking-wide text-white mt-1`}>
              {greeting},{" "}
              <span className={`${greatVibes.className} font-normal capitalize ml-1 text-pink-100 text-[1.2em]`}>
                {greetingName}
                {adminName ? "!" : ""}
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
            <Calendar className="h-16.5 w-14 shrink-0" fill="#F8C8E2" stroke="#6B4F72" strokeWidth={1} />

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
            <Clock className="h-16.5 w-14 shrink-0" fill="#F8C8E2" stroke="#6B4F72" strokeWidth={1} />

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

      {/* Stat Cards (a direct child of the page, so it spans the full width) */}
      <RequestStatCards total={69} pending={30} approved={18} rejected={21} />
    </div>
  );
}
