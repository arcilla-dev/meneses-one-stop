"use client";

import { Bell, BookOpen, ClipboardList, FileCheck2, Settings } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { CURRENT_TERM } from "./data";
import { registrarDisplayFont } from "./fonts";

const profileFields = [
  ["Name", "full_name"],
  ["Student ID", "student_number"],
  ["Program", "program"],
  ["Year & Section", "year_section"],
];

export default function OverviewTab({ notifications, currentSubjects, onTabChange }) {
  const { studentProfile } = useUserProfile();
  const latestNotifications = notifications.slice(0, 3);
  const isEnrolled = currentSubjects.length > 0;
  const totalUnits = currentSubjects.reduce(
    (total, subject) => total + Number.parseFloat(subject.units || "0"),
    0,
  );
  const readyNotification = notifications.find((notification) =>
    notification.message.toLowerCase().includes("ready for claiming"),
  );
  const stats = [
    { label: "Current Subjects", value: currentSubjects.length, icon: BookOpen },
    { label: "Total Units", value: totalUnits.toFixed(1), icon: ClipboardList },
    { label: "Notifications", value: notifications.length, icon: Bell },
  ];

  function renderProfileValue(field) {
    if (!studentProfile) {
      return <span className="block h-4 w-36 animate-pulse rounded bg-gray-300" />;
    }

    const value = studentProfile[field];
    return value == null || value === "" ? "—" : value;
  }

  return (
    <div className="mb-8 flex w-full flex-col gap-6">
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

      <section aria-label="Registrar statistics" className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-md border border-[#956887] bg-[#e8c3da] p-4 text-[#48305d] shadow-sm"
          >
            <Icon className="h-7 w-7 shrink-0 text-[#8c6895]" aria-hidden="true" />
            <div>
              <p className="text-2xl font-bold leading-none">{value}</p>
              <p className="mt-1 text-sm font-semibold">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {readyNotification && (
        <section
          role="status"
          className="flex items-start gap-3 rounded-md border border-[#956887] bg-[#c58eb4] p-4 text-[#392641] shadow-sm"
        >
          <FileCheck2 className="mt-0.5 h-6 w-6 shrink-0 text-[#684f6c]" aria-hidden="true" />
          <div>
            <h2 className={`${registrarDisplayFont.className} text-[17px] leading-tight text-[#48305d]`}>
              Ready for claiming
            </h2>
            <p className="mt-1 text-sm">{readyNotification.message}</p>
            <p className="mt-1 text-xs text-[#684f6c]">{readyNotification.date}</p>
          </div>
        </section>
      )}

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

      <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
        <h2 className={`${registrarDisplayFont.className} mb-3 text-[17px] leading-tight text-[#48305d]`}>
          Quick Actions
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { label: "Request a Document", tab: "Requests", icon: FileCheck2 },
            { label: "Add/Remove Subjects", tab: "Add/Remove Subjects", icon: BookOpen },
            { label: "View Notifications", tab: "Notifications", icon: Bell },
          ].map(({ label, tab, icon: Icon }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className="flex items-center justify-center gap-2 rounded-md bg-[#d8a6c7] px-3 py-3 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}
