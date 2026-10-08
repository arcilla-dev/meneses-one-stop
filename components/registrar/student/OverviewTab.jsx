"use client";

import { Settings } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { CURRENT_TERM } from "./data";
import { registrarDisplayFont } from "./fonts";

const profileFields = [
  ["Name", "full_name"],
  ["Student ID", "student_number"],
  ["Program", "program"],
  ["Year & Section", "year_section"],
];

export default function OverviewTab({ notifications, currentSubjects }) {
  const { studentProfile } = useUserProfile();
  const latestNotifications = notifications.slice(0, 3);
  const isEnrolled = currentSubjects.length > 0;

  function renderProfileValue(field) {
    if (!studentProfile) {
      return <span className="block h-4 w-36 animate-pulse rounded bg-gray-300" />;
    }

    const value = studentProfile[field];
    return value == null || value === "" ? "—" : value;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
        <h2 className={`${registrarDisplayFont.className} mb-3 text-[17px] leading-tight text-[#48305d]`}>
          Student Information
        </h2>
        <div className="grid gap-x-8 gap-y-3 text-[#392641] sm:grid-cols-2">
          {profileFields.map(([label, field]) => (
            <div key={field} className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-2">
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-right text-sm">{renderProfileValue(field)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-2">
            <span className="text-sm font-semibold">Semester</span>
            <span className="text-right text-sm">{CURRENT_TERM}</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-2">
            <span className="text-sm font-semibold">Enrollment Status</span>
            {/* TODO: Replace with the student's real enrollment status from the database. */}
            <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${isEnrolled ? "bg-green-700" : "bg-red-700"}`}>
              {isEnrolled ? "Enrolled" : "Not enrolled"}
            </span>
          </div>
        </div>
      </section>

      <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
        <h2 className={`${registrarDisplayFont.className} mb-2 text-[17px] leading-tight text-[#48305d]`}>
          Latest Notifications
        </h2>
        {latestNotifications.length > 0 ? (
          <ul className="space-y-1">
            {latestNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`flex items-center gap-3 rounded-md px-5 py-4 text-[#392641] ${
                  notification.isRead ? "bg-[#e8c3da]" : "bg-[#c58eb4] ring-2 ring-[#87577d]"
                }`}
              >
                <Settings className="h-7 w-7 shrink-0 fill-[#d5a0c3] text-[#8c6895]" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold leading-tight">{notification.message}</p>
                  <p className="mt-1 text-sm leading-tight text-[#684f6c]">{notification.date}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center text-center text-[#48305d]">
            <p className="text-lg font-semibold">No notifications.</p>
            <p className="mt-1 text-sm">You&apos;re all caught up.</p>
          </div>
        )}
      </section>
    </div>
  );
}
