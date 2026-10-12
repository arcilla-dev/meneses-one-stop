"use client";

import { Bell, ClipboardList, HeartPulse } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { SERVICE_ICONS } from "./data";
import { registrarDisplayFont } from "../registrar/fonts";

const upcomingStatuses = new Set(["Pending", "Approved"]);
const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
};
const profileFields = [
  ["Name", "full_name"],
  ["Student ID", "student_number"],
  ["Program", "program"],
  ["Year & Section", "year_section"],
];

function localDayTimestamp(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function appointmentDayTimestamp(appointment) {
  return localDayTimestamp(new Date(appointment.date));
}

function appointmentTimestamp(appointment) {
  const date = new Date(appointment.date);
  const match = appointment.timeStart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  date.setHours(0, 0, 0, 0);
  if (match) {
    let hours = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
    date.setHours(hours, Number(match[2]), 0, 0);
  }
  return date.getTime();
}

function formatTimeRange(timeStart, timeEnd) {
  const start = timeStart.replace(/\s*(AM|PM)$/i, "");
  const startMeridiem = timeStart.match(/\s*(AM|PM)$/i)?.[1];
  const endMeridiem = timeEnd.match(/\s*(AM|PM)$/i)?.[1];
  const formattedStart =
    startMeridiem && startMeridiem.toUpperCase() === endMeridiem?.toUpperCase()
      ? start
      : timeStart;
  return `${formattedStart} - ${timeEnd}`;
}

function AppointmentSummary({ appointment }) {
  const Icon = SERVICE_ICONS[appointment.service] ?? SERVICE_ICONS.Other;
  return (
    <li className="flex items-start gap-3 rounded-md bg-[#e8c3da] p-3 text-[#392641]">
      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#8c6895]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{appointment.service}</p>
        <p className="text-xs text-[#684f6c]">
          {appointment.date} &bull;{" "}
          {formatTimeRange(appointment.timeStart, appointment.timeEnd)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
          statusStyles[appointment.status] ?? statusStyles.Pending
        }`}
      >
        {appointment.status}
      </span>
    </li>
  );
}

function NextAppointmentBanner({ appointment }) {
  const Icon = SERVICE_ICONS[appointment.service] ?? SERVICE_ICONS.Other;
  return (
    <section className="flex items-start gap-3 rounded-md border border-[#956887] bg-[#c58eb4] p-6 text-[#392641] shadow-sm">
      <Icon
        className="mt-0.5 h-7 w-7 shrink-0 text-[#684f6c]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <h2
          className={`${registrarDisplayFont.className} text-2xl leading-tight text-[#48305d]`}
        >
          Next appointment
        </h2>
        <p className="mt-1 font-bold">{appointment.service}</p>
        <p className="text-sm text-[#684f6c]">
          {appointment.date} &bull;{" "}
          {formatTimeRange(appointment.timeStart, appointment.timeEnd)}
        </p>
        {appointment.status === "Pending" && (
          <p className="mt-1 text-sm text-[#684f6c]">
            Waiting for clinic approval.
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
          statusStyles[appointment.status]
        }`}
      >
        {appointment.status}
      </span>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-label="Loading student information">
      {profileFields.map(([label]) => (
        <div key={label} className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3">
          <span className="text-sm font-semibold">{label}</span>
          <span className="h-4 w-36 animate-pulse rounded bg-[#d8afcc]" />
        </div>
      ))}
    </div>
  );
}

export default function OverviewTab({ appointments, notifications, onNavigate }) {
  const { studentProfile, loading } = useUserProfile();
  const today = localDayTimestamp(new Date());
  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        upcomingStatuses.has(appointment.status) &&
        appointmentDayTimestamp(appointment) >= today,
    )
    .sort((first, second) => appointmentTimestamp(first) - appointmentTimestamp(second));
  const upcomingApproved =
    upcomingAppointments.find((appointment) => appointment.status === "Approved") ??
    upcomingAppointments.find((appointment) => appointment.status === "Pending");
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const stats = [
    {
      label: "Upcoming Appointments",
      value: upcomingAppointments.length,
      tab: "My Appointments",
      icon: ClipboardList,
    },
    {
      label: "Pending Requests",
      value: appointments.filter((appointment) => appointment.status === "Pending").length,
      tab: "My Appointments",
      icon: HeartPulse,
    },
    {
      label: "Notifications",
      value: unreadNotifications,
      tab: "Notifications",
      icon: Bell,
    },
  ];
  const recentNotifications = notifications.slice(0, 3);

  function profileValue(field) {
    const value = studentProfile?.[field];
    return value == null || value === "" ? "—" : value;
  }

  return (
    <div className="mb-8 flex w-full flex-col gap-6">
      <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
        <h2
          className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
        >
          Student Information
        </h2>
        {loading ? (
          <ProfileSkeleton />
        ) : studentProfile ? (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {profileFields.map(([label, field]) => (
              <div
                key={field}
                className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3"
              >
                <dt className="text-sm font-semibold">{label}</dt>
                <dd className="text-right text-sm">{profileValue(field)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-[#684f6c]">
            Sign in to see your information.
          </p>
        )}
      </section>

      <section aria-label="Infirmary statistics" className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, tab, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(tab)}
            className="flex items-center gap-4 rounded-md border border-[#956887] bg-[#e8c3da] p-6 text-left text-[#48305d] shadow-sm transition-colors hover:bg-[#d8a6c7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
          >
            <Icon className="h-8 w-8 shrink-0 text-[#8c6895]" aria-hidden="true" />
            <span>
              <span className="block text-3xl font-bold leading-none">{value}</span>
              <span className="mt-1 block text-sm font-semibold">{label}</span>
            </span>
          </button>
        ))}
      </section>

      {upcomingApproved && (
        <NextAppointmentBanner appointment={upcomingApproved} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              className={`${registrarDisplayFont.className} text-2xl leading-tight text-[#48305d]`}
            >
              Upcoming Appointments
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("My Appointments")}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
            >
              View all
            </button>
          </div>
          {upcomingAppointments.length > 0 ? (
            <ul className="space-y-2">
              {upcomingAppointments.slice(0, 3).map((appointment) => (
                <AppointmentSummary
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-[#684f6c]">
              No upcoming appointments.
            </p>
          )}
        </section>

        <section className="rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              className={`${registrarDisplayFont.className} text-2xl leading-tight text-[#48305d]`}
            >
              Latest Notifications
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("Notifications")}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
            >
              View all
            </button>
          </div>
          {recentNotifications.length > 0 ? (
            <ul className="space-y-2">
              {recentNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`rounded-md p-3 ${
                    notification.read
                      ? "bg-[#e8c3da]"
                      : "bg-[#c58eb4] ring-2 ring-[#87577d]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#392641]">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-[#684f6c]">
                    {notification.date}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-[#684f6c]">
              No notifications yet.
            </p>
          )}
        </section>
      </div>

      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        For emergencies, go to the clinic immediately.
      </div>

      <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
        <h2
          className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
        >
          Quick Actions
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: "Request a Schedule", tab: "Request Schedule" },
            { label: "My Appointments", tab: "My Appointments" },
          ].map(({ label, tab }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="rounded-md bg-[#d8a6c7] px-4 py-3 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
