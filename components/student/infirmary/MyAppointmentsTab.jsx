"use client";

import { useMemo, useState } from "react";
import { registrarDisplayFont } from "../registrar/fonts";
import AppointmentItem from "./AppointmentItem";

const filters = ["All", "Pending", "Approved", "Rejected", "Cancelled"];
const pastStatuses = new Set(["Cancelled", "Rejected", "Completed"]);

function getLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getAppointmentDay(appointment) {
  const date = new Date(appointment.date);
  return getLocalDay(date);
}

function getAppointmentTimestamp(appointment) {
  const date = new Date(appointment.date);
  const timeMatch = appointment.timeStart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (timeMatch) {
    let hours = Number(timeMatch[1]) % 12;
    if (timeMatch[3].toUpperCase() === "PM") hours += 12;
    date.setHours(hours, Number(timeMatch[2]), 0, 0);
  }

  return date.getTime();
}

function isPastAppointment(appointment, today) {
  return (
    getAppointmentDay(appointment) < today ||
    pastStatuses.has(appointment.status)
  );
}

export default function MyAppointmentsTab({
  appointments,
  onCancelAppointment,
  onChangeAppointmentStatus,
  onTabChange,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const today = getLocalDay(new Date());
  const statusCounts = useMemo(
    () =>
      filters.reduce((counts, filter) => {
        counts[filter] =
          filter === "All"
            ? appointments.length
            : appointments.filter((appointment) => appointment.status === filter)
                .length;
        return counts;
      }, {}),
    [appointments],
  );
  const filteredAppointments = appointments.filter(
    (appointment) =>
      activeFilter === "All" || appointment.status === activeFilter,
  );
  const upcoming = filteredAppointments
    .filter((appointment) => !isPastAppointment(appointment, today))
    .sort((first, second) => getAppointmentTimestamp(first) - getAppointmentTimestamp(second));
  const past = filteredAppointments
    .filter((appointment) => isPastAppointment(appointment, today))
    .sort((first, second) => getAppointmentTimestamp(second) - getAppointmentTimestamp(first));

  function renderGroup(title, groupAppointments) {
    if (groupAppointments.length === 0) return null;

    return (
      <section className="mt-4 first:mt-0">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#684f6c]">
          {title}
        </h3>
        <ul className="space-y-2">
          {groupAppointments.map((appointment) => (
            <AppointmentItem
              key={appointment.id}
              appointment={appointment}
              onCancel={onCancelAppointment}
              onChangeStatus={onChangeAppointmentStatus}
            />
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
      <h2
        className={`${registrarDisplayFont.className} mb-3 text-center text-[17px] leading-tight text-[#48305d]`}
      >
        My Appointments
      </h2>
      {appointments.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center text-center text-[#48305d]">
          <p className="text-lg font-semibold">No appointments yet.</p>
          <button
            type="button"
            onClick={() => onTabChange("Request Schedule")}
            className="mt-3 rounded-md bg-[#d8a6c7] px-4 py-2 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
          >
            Request a Schedule
          </button>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="Filter appointments by status"
            className="mb-4 flex flex-wrap gap-1 rounded-md bg-[#e8c3da] p-1"
          >
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  activeFilter === filter
                    ? "bg-[#87577d] text-white shadow-sm"
                    : "text-[#48305d] hover:bg-[#d8a6c7]"
                }`}
              >
                {filter} ({statusCounts[filter]})
              </button>
            ))}
          </div>
          {filteredAppointments.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center text-center text-[#48305d]">
              <p className="text-base font-semibold">
                No {activeFilter.toLowerCase()} appointments.
              </p>
            </div>
          ) : (
            <>
              {renderGroup("Upcoming", upcoming)}
              {renderGroup("Past", past)}
            </>
          )}
        </>
      )}
    </section>
  );
}
