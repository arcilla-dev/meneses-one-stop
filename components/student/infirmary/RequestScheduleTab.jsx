"use client";

import { useRef, useState } from "react";
import {
  CLAIM_REQUIREMENTS,
  CLINIC_DAYS,
  SERVICE_ICONS,
  SERVICES,
  TIME_SLOTS,
} from "./data";
import { registrarDisplayFont } from "../registrar/fonts";

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
};

function getLocalDateInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDateInputValue(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function timeToMinutes(value) {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return Number.POSITIVE_INFINITY;

  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
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

function appointmentTimestamp(appointment) {
  const date = new Date(appointment.date);
  date.setHours(0, 0, 0, 0);
  return date.getTime() + timeToMinutes(appointment.timeStart) * 60000;
}

function createAppointmentId() {
  return `appointment-${globalThis.crypto.randomUUID()}`;
}

export default function RequestScheduleTab({
  appointments,
  addAppointment,
  addNotification,
  onNavigate,
}) {
  const [service, setService] = useState("");
  const [otherService, setOtherService] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const submittingRef = useRef(false);
  const todayValue = getLocalDateInputValue();
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const isToday = preferredDate === todayValue;
  const availableTimeSlots = TIME_SLOTS.filter(
    (slot) =>
      !isToday ||
      timeToMinutes(slot.start) > today.getHours() * 60 + today.getMinutes(),
  );
  const resolvedService =
    service === "Other" ? otherService.trim() : service;
  const pendingServiceRequest = appointments.some(
    (appointment) =>
      appointment.status === "Pending" &&
      appointment.service.toLowerCase() === resolvedService.toLowerCase(),
  );
  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        ["Pending", "Approved"].includes(appointment.status) &&
        appointmentTimestamp(appointment) >= todayStart,
    )
    .sort((first, second) => appointmentTimestamp(first) - appointmentTimestamp(second))
    .slice(0, 3);

  function updateField(setter, value, field) {
    setter(value);
    setSuccessMessage("");
    setErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) return;
    setSuccessMessage("");

    const nextErrors = {};
    if (!service) nextErrors.service = "Select a service.";
    if (service === "Other" && !otherService.trim()) {
      nextErrors.otherService = "Specify the service.";
    }
    if (!preferredDate) {
      nextErrors.preferredDate = "Select a preferred date.";
    } else {
      const [year, month, day] = preferredDate.split("-").map(Number);
      const selectedDate = new Date(year, month - 1, day);
      if (preferredDate < todayValue) {
        nextErrors.preferredDate = "The date cannot be in the past.";
      } else if (!CLINIC_DAYS.includes(selectedDate.getDay())) {
        nextErrors.preferredDate = "Choose a clinic day from Monday to Friday.";
      }
    }
    if (!preferredTime || !availableTimeSlots.some((slot) => slot.start === preferredTime)) {
      nextErrors.preferredTime = "Select an available time.";
    }

    const finalService = service === "Other" ? otherService.trim() : service;
    const formattedDate = preferredDate
      ? formatDateInputValue(preferredDate)
      : "";
    const selectedSlot = TIME_SLOTS.find((slot) => slot.start === preferredTime);
    if (
      preferredDate &&
      selectedSlot &&
      appointments.some(
        (appointment) =>
          ["Pending", "Approved"].includes(appointment.status) &&
          appointment.date === formattedDate &&
          timeToMinutes(selectedSlot.start) < timeToMinutes(appointment.timeEnd) &&
          timeToMinutes(appointment.timeStart) < timeToMinutes(selectedSlot.end),
      )
    ) {
      nextErrors.preferredTime =
        "You already have an appointment at this time.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const dateSubmitted = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    const appointment = {
      id: createAppointmentId(),
      service: finalService,
      date: formattedDate,
      timeStart: selectedSlot.start,
      timeEnd: selectedSlot.end,
      status: "Pending",
      remarks: remarks.trim(),
      dateSubmitted,
    };

    submittingRef.current = true;
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    addAppointment(appointment);
    addNotification({
      message: `Your ${finalService} request on ${formattedDate} at ${selectedSlot.start} has been submitted.`,
      date: dateSubmitted,
      read: false,
      type: "schedule-request",
    });
    setService("");
    setOtherService("");
    setPreferredDate("");
    setPreferredTime("");
    setRemarks("");
    setErrors({});
    setSuccessMessage(
      "Your request has been submitted. Please wait for clinic approval.",
    );
    submittingRef.current = false;
    setIsSubmitting(false);
  }

  return (
    <div className="grid w-full gap-4 lg:grid-cols-5">
      <div className="space-y-3 lg:col-span-3">
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          For emergencies, go to the clinic immediately. Do not use this form.
        </div>
        <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-4 shadow-sm">
          <h2
            className={`${registrarDisplayFont.className} mb-4 text-center text-[17px] leading-tight text-[#48305d]`}
          >
            Request Schedule
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-[#48305d]">
                Select Service <span aria-hidden="true">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICES.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm text-[#45324f] ${
                      service === option
                        ? "border-[#87577d] bg-[#e8c3da]"
                        : "border-[#c7a2bb] bg-[#f9e6f1]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      value={option}
                      checked={service === option}
                      onChange={() => {
                        updateField(setService, option, "service");
                        setOtherService("");
                      }}
                      className="accent-[#87577d]"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {errors.service && (
                <p className="mt-1 text-sm text-red-700">{errors.service}</p>
              )}
            </fieldset>

            {service === "Other" && (
              <div>
                <label
                  htmlFor="specify-infirmary-service"
                  className="mb-1 block text-sm font-bold text-[#48305d]"
                >
                  Specify service <span aria-hidden="true">*</span>
                </label>
                <input
                  id="specify-infirmary-service"
                  type="text"
                  maxLength={60}
                  required
                  value={otherService}
                  onChange={(event) =>
                    updateField(setOtherService, event.target.value, "otherService")
                  }
                  className="w-full rounded-md border border-[#a27d9a] bg-[#f9e6f1] px-3 py-2 text-sm text-[#45324f] outline-none focus:ring-2 focus:ring-[#87577d]"
                />
                {errors.otherService && (
                  <p className="mt-1 text-sm text-red-700">
                    {errors.otherService}
                  </p>
                )}
              </div>
            )}

            {service === "Medical Certificate" && (
              <p className="rounded-md bg-[#e8c3da] px-3 py-2 text-sm text-[#48305d]">
                For a medical certificate, {CLAIM_REQUIREMENTS} when claiming. No
                payment or fee is required.
              </p>
            )}

            {pendingServiceRequest && resolvedService && (
              <p className="rounded-md bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
                You already have a pending request for this service.
              </p>
            )}

            <div>
              <label
                htmlFor="preferred-infirmary-date"
                className="mb-1 block text-sm font-bold text-[#48305d]"
              >
                Preferred Date <span aria-hidden="true">*</span>
              </label>
              <input
                id="preferred-infirmary-date"
                type="date"
                min={todayValue}
                required
                value={preferredDate}
                onChange={(event) =>
                  updateField(setPreferredDate, event.target.value, "preferredDate")
                }
                className="w-full rounded-md border border-[#a27d9a] bg-[#f9e6f1] px-3 py-2 text-sm text-[#45324f] outline-none focus:ring-2 focus:ring-[#87577d]"
              />
              {errors.preferredDate && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.preferredDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="preferred-infirmary-time"
                className="mb-1 block text-sm font-bold text-[#48305d]"
              >
                Preferred Time <span aria-hidden="true">*</span>
              </label>
              <select
                id="preferred-infirmary-time"
                required
                value={preferredTime}
                onChange={(event) =>
                  updateField(setPreferredTime, event.target.value, "preferredTime")
                }
                className="w-full rounded-md border border-[#a27d9a] bg-[#f9e6f1] px-3 py-2 text-sm text-[#45324f] outline-none focus:ring-2 focus:ring-[#87577d]"
              >
                <option value="">Select a time</option>
                {availableTimeSlots.map((slot) => (
                  <option key={slot.start} value={slot.start}>
                    {formatTimeRange(slot.start, slot.end)}
                  </option>
                ))}
              </select>
              {isToday && availableTimeSlots.length === 0 && (
                <p className="mt-1 text-sm text-[#684f6c]">
                  No available time slots remain today.
                </p>
              )}
              {errors.preferredTime && (
                <p className="mt-1 text-sm text-red-700">
                  {errors.preferredTime}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="infirmary-remarks"
                className="mb-1 block text-sm font-bold text-[#48305d]"
              >
                Reason / Remarks
              </label>
              <textarea
                id="infirmary-remarks"
                maxLength={300}
                rows={3}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                className="w-full resize-y rounded-md border border-[#a27d9a] bg-[#f9e6f1] px-3 py-2 text-sm text-[#45324f] outline-none focus:ring-2 focus:ring-[#87577d]"
              />
              <p className="mt-1 text-right text-xs text-[#684f6c]">
                {remarks.length}/300
              </p>
            </div>

            {successMessage && (
              <p
                role="status"
                className="rounded-md bg-green-100 px-3 py-2 text-sm font-semibold text-green-800"
              >
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#87577d] py-3 text-lg font-bold text-white transition-colors hover:bg-[#71476b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </section>
      </div>

      <section className="h-fit w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-4 shadow-sm lg:col-span-2">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2
            className={`${registrarDisplayFont.className} text-[17px] leading-tight text-[#48305d]`}
          >
            Upcoming Appointments
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("My Appointments")}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
          >
            View all
          </button>
        </div>
        {upcomingAppointments.length > 0 ? (
          <ul className="space-y-2">
            {upcomingAppointments.map((appointment) => {
              const Icon =
                SERVICE_ICONS[appointment.service] ?? SERVICE_ICONS.Other;
              return (
                <li
                  key={appointment.id}
                  className="flex items-start gap-2 rounded-md bg-[#e8c3da] p-3 text-[#392641]"
                >
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#8c6895]"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{appointment.service}</p>
                    <p className="text-xs text-[#684f6c]">
                      {appointment.date} &bull;{" "}
                      {formatTimeRange(
                        appointment.timeStart,
                        appointment.timeEnd,
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      statusStyles[appointment.status] ?? statusStyles.Pending
                    }`}
                  >
                    {appointment.status}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-[#684f6c]">
            No upcoming appointments.
          </p>
        )}
      </section>
    </div>
  );
}
