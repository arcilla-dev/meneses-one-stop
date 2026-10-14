'use client';

import { useState, type FormEvent } from 'react';
import { registrarDisplayFont } from '../../../lib/infirmaryFonts';
import {
  CLAIM_REMINDER,
  CLINIC_DAYS,
  SERVICES,
  SERVICE_ICONS,
  TIME_SLOTS,
  statusStyles,
  type Appointment,
  type AppointmentDraft,
} from '../../../lib/infirmaryData';
import {
  appointmentDay,
  appointmentTimestamp,
  dayTimestamp,
  formatDisplayDate,
  formatTimeRange,
  parseISODate,
  timeToMinutes,
  toDateInputValue,
} from '../../../lib/infirmaryUtils';
import type { InfirmaryTab } from './InfirmaryHeader';

interface Props {
  appointments: Appointment[];
  /** Do your Supabase insert in the page. Throw an Error to show its message in the form. */
  onSubmit: (draft: AppointmentDraft) => Promise<void>;
  onNavigate: (tab: InfirmaryTab) => void;
}

const fieldClass =
  'w-full rounded-md border border-[#a27d9a] bg-[#f9e6f1] px-3 py-2 text-sm text-[#45324f] outline-none focus:ring-2 focus:ring-[#87577d]';
const labelClass = 'mb-1 block text-sm font-bold text-[#48305d]';
const activeStatuses = ['Pending', 'Approved'];

export default function RequestScheduleTab({ appointments, onSubmit, onNavigate }: Props) {
  const [service, setService] = useState('');
  const [otherService, setOtherService] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const now = new Date();
  const todayValue = toDateInputValue(now);
  const todayStart = dayTimestamp(now);
  const isToday = preferredDate === todayValue;
  const availableTimeSlots = TIME_SLOTS.filter(
    (slot) => !isToday || timeToMinutes(slot.start) > now.getHours() * 60 + now.getMinutes(),
  );
  const resolvedService = service === 'Other' ? otherService.trim() : service;
  const hasPendingForService = appointments.some(
    (a) => a.status === 'Pending' && a.service.toLowerCase() === resolvedService.toLowerCase(),
  );
  const upcomingAppointments = appointments
    .filter((a) => activeStatuses.includes(a.status) && appointmentDay(a) >= todayStart)
    .sort((a, b) => appointmentTimestamp(a) - appointmentTimestamp(b))
    .slice(0, 3);

  function updateField(setter: (value: string) => void, value: string, field: string) {
    setter(value);
    setSuccessMessage('');
    setFormError('');
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setSuccessMessage('');
    setFormError('');

    const nextErrors: Record<string, string> = {};
    if (!service) nextErrors.service = 'Select a service.';
    if (service === 'Other' && !otherService.trim()) nextErrors.otherService = 'Specify the service.';

    if (!preferredDate) {
      nextErrors.preferredDate = 'Select a preferred date.';
    } else if (preferredDate < todayValue) {
      nextErrors.preferredDate = 'The date cannot be in the past.';
    } else if (!CLINIC_DAYS.includes(parseISODate(preferredDate).getDay())) {
      nextErrors.preferredDate = 'Choose a clinic day from Monday to Friday.';
    }

    const slot = TIME_SLOTS.find((s) => s.start === preferredTime);
    if (!slot || !availableTimeSlots.some((s) => s.start === preferredTime)) {
      nextErrors.preferredTime = 'Select an available time.';
    } else if (
      preferredDate &&
      appointments.some(
        (a) =>
          activeStatuses.includes(a.status) &&
          a.date === preferredDate &&
          timeToMinutes(slot.start) < timeToMinutes(a.timeEnd) &&
          timeToMinutes(a.timeStart) < timeToMinutes(slot.end),
      )
    ) {
      nextErrors.preferredTime = 'You already have an appointment at this time.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !slot) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        service: resolvedService,
        date: preferredDate,
        timeStart: slot.start,
        timeEnd: slot.end,
        remarks: remarks.trim(),
      });
      setService('');
      setOtherService('');
      setPreferredDate('');
      setPreferredTime('');
      setRemarks('');
      setErrors({});
      setSuccessMessage('Your request has been submitted. Please wait for clinic approval.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-4 lg:grid-cols-5">
      <div className="space-y-3 lg:col-span-3">
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          For emergencies, go to the clinic immediately. Do not use this form.
        </div>
        <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-4 shadow-sm">
          <h2 className={`${registrarDisplayFont.className} mb-4 text-center text-[17px] leading-tight text-[#48305d]`}>Request Schedule</h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-[#48305d]">
                Select Service <span aria-hidden="true">*</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICES.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm text-[#45324f] ${
                      service === option ? 'border-[#87577d] bg-[#e8c3da]' : 'border-[#c7a2bb] bg-[#f9e6f1]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      value={option}
                      checked={service === option}
                      onChange={() => {
                        updateField(setService, option, 'service');
                        setOtherService('');
                      }}
                      className="accent-[#87577d]"
                    />
                    {option}
                  </label>
                ))}
              </div>
              {errors.service && <p className="mt-1 text-sm text-red-700">{errors.service}</p>}
            </fieldset>

            {service === 'Other' && (
              <div>
                <label htmlFor="specify-infirmary-service" className={labelClass}>
                  Specify service <span aria-hidden="true">*</span>
                </label>
                <input
                  id="specify-infirmary-service"
                  type="text"
                  maxLength={60}
                  value={otherService}
                  onChange={(e) => updateField(setOtherService, e.target.value, 'otherService')}
                  className={fieldClass}
                />
                {errors.otherService && <p className="mt-1 text-sm text-red-700">{errors.otherService}</p>}
              </div>
            )}

            {service === 'Medical Certificate' && (
              <p className="rounded-md bg-[#e8c3da] px-3 py-2 text-sm text-[#48305d]">
                For a medical certificate, please {CLAIM_REMINDER} when claiming. No payment or fee is required.
              </p>
            )}

            {hasPendingForService && resolvedService && (
              <p className="rounded-md bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
                You already have a pending request for this service.
              </p>
            )}

            <div>
              <label htmlFor="preferred-infirmary-date" className={labelClass}>
                Preferred Date <span aria-hidden="true">*</span>
              </label>
              <input
                id="preferred-infirmary-date"
                type="date"
                min={todayValue}
                value={preferredDate}
                onChange={(e) => updateField(setPreferredDate, e.target.value, 'preferredDate')}
                className={fieldClass}
              />
              {errors.preferredDate && <p className="mt-1 text-sm text-red-700">{errors.preferredDate}</p>}
            </div>

            <div>
              <label htmlFor="preferred-infirmary-time" className={labelClass}>
                Preferred Time <span aria-hidden="true">*</span>
              </label>
              <select
                id="preferred-infirmary-time"
                value={preferredTime}
                onChange={(e) => updateField(setPreferredTime, e.target.value, 'preferredTime')}
                className={fieldClass}
              >
                <option value="">Select a time</option>
                {availableTimeSlots.map((slot) => (
                  <option key={slot.start} value={slot.start}>
                    {formatTimeRange(slot.start, slot.end)}
                  </option>
                ))}
              </select>
              {isToday && availableTimeSlots.length === 0 && (
                <p className="mt-1 text-sm text-[#684f6c]">No available time slots remain today.</p>
              )}
              {errors.preferredTime && <p className="mt-1 text-sm text-red-700">{errors.preferredTime}</p>}
            </div>

            <div>
              <label htmlFor="infirmary-remarks" className={labelClass}>Reason / Remarks</label>
              <textarea
                id="infirmary-remarks"
                maxLength={300}
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={`${fieldClass} resize-y`}
              />
              <p className="mt-1 text-right text-xs text-[#684f6c]">{remarks.length}/300</p>
            </div>

            {formError && (
              <p role="alert" className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>
            )}
            {successMessage && (
              <p role="status" className="rounded-md bg-green-100 px-3 py-2 text-sm font-semibold text-green-800">{successMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#87577d] py-3 text-lg font-bold text-white transition-colors hover:bg-[#71476b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </section>
      </div>

      <section className="h-fit w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-4 shadow-sm lg:col-span-2">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className={`${registrarDisplayFont.className} text-[17px] leading-tight text-[#48305d]`}>Upcoming Appointments</h2>
          <button
            type="button"
            onClick={() => onNavigate('My Appointments')}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
          >
            View all
          </button>
        </div>
        {upcomingAppointments.length > 0 ? (
          <ul className="space-y-2">
            {upcomingAppointments.map((a) => {
              const Icon = SERVICE_ICONS[a.service] ?? SERVICE_ICONS.Other;
              return (
                <li key={a.id} className="flex items-start gap-2 rounded-md bg-[#e8c3da] p-3 text-[#392641]">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#8c6895]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{a.service}</p>
                    <p className="text-xs text-[#684f6c]">
                      {formatDisplayDate(a.date)} &bull; {formatTimeRange(a.timeStart, a.timeEnd)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[a.status]}`}>{a.status}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-[#684f6c]">No upcoming appointments.</p>
        )}
      </section>
    </div>
  );
}