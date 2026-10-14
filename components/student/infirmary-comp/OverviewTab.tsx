'use client';

import { Bell, ClipboardList, HeartPulse } from 'lucide-react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { registrarDisplayFont } from '../../../lib/infirmaryFonts';
import {
  SERVICE_ICONS,
  statusStyles,
  type Appointment,
  type InfirmaryNotification,
} from '../../../lib/infirmaryData';
import {
  appointmentDay,
  appointmentTimestamp,
  dayTimestamp,
  formatDisplayDate,
  formatTimeRange,
} from '../../../lib/infirmaryUtils';
import type { InfirmaryTab } from './InfirmaryHeader';

const profileFields: [string, string][] = [
  ['Name', 'full_name'],
  ['Student ID', 'student_number'],
  ['Program', 'program'],
  ['Year & Section', 'year_section'],
];

const panel = 'rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm';
const heading = `${registrarDisplayFont.className} text-2xl leading-tight text-[#48305d]`;
const viewAll = 'shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]';

function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  const Icon = SERVICE_ICONS[appointment.service] ?? SERVICE_ICONS.Other;
  return (
    <li className="flex items-start gap-3 rounded-md bg-[#e8c3da] p-3 text-[#392641]">
      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#8c6895]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{appointment.service}</p>
        <p className="text-xs text-[#684f6c]">
          {formatDisplayDate(appointment.date)} &bull; {formatTimeRange(appointment.timeStart, appointment.timeEnd)}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[appointment.status]}`}>{appointment.status}</span>
    </li>
  );
}

function NextAppointmentBanner({ appointment }: { appointment: Appointment }) {
  const Icon = SERVICE_ICONS[appointment.service] ?? SERVICE_ICONS.Other;
  return (
    <section className="flex items-start gap-3 rounded-md border border-[#956887] bg-[#c58eb4] p-6 text-[#392641] shadow-sm">
      <Icon className="mt-0.5 h-7 w-7 shrink-0 text-[#684f6c]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 className={heading}>Next appointment</h2>
        <p className="mt-1 font-bold">{appointment.service}</p>
        <p className="text-sm text-[#684f6c]">
          {formatDisplayDate(appointment.date)} &bull; {formatTimeRange(appointment.timeStart, appointment.timeEnd)}
        </p>
        {appointment.status === 'Pending' && <p className="mt-1 text-sm text-[#684f6c]">Waiting for clinic approval.</p>}
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[appointment.status]}`}>{appointment.status}</span>
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

interface Props {
  appointments: Appointment[];
  notifications: InfirmaryNotification[];
  onNavigate: (tab: InfirmaryTab) => void;
}

export default function OverviewTab({ appointments, notifications, onNavigate }: Props) {
  const { studentProfile, loading } = useUserProfile();
  const today = dayTimestamp(new Date());

  const upcomingAppointments = appointments
    .filter((a) => (a.status === 'Pending' || a.status === 'Approved') && appointmentDay(a) >= today)
    .sort((a, b) => appointmentTimestamp(a) - appointmentTimestamp(b));
  // Prefer the soonest approved appointment, otherwise the soonest pending one
  const nextAppointment =
    upcomingAppointments.find((a) => a.status === 'Approved') ?? upcomingAppointments.find((a) => a.status === 'Pending');
  const unreadCount = notifications.filter((n) => !n.read).length;

  const stats: { label: string; value: number; tab: InfirmaryTab; icon: typeof Bell }[] = [
    { label: 'Upcoming Appointments', value: upcomingAppointments.length, tab: 'My Appointments', icon: ClipboardList },
    { label: 'Pending Requests', value: appointments.filter((a) => a.status === 'Pending').length, tab: 'My Appointments', icon: HeartPulse },
    { label: 'Unread Notifications', value: unreadCount, tab: 'Notifications', icon: Bell },
  ];

  function profileValue(field: string) {
    const value = (studentProfile as unknown as Record<string, string | number | null | undefined> | null)?.[field];
    return value == null || value === '' ? '—' : value;
  }

  return (
    <div className="mb-8 flex w-full flex-col gap-6">
      <section className={`${panel} w-full`}>
        <h2 className={`${heading} mb-4`}>Student Information</h2>
        {loading ? (
          <ProfileSkeleton />
        ) : studentProfile ? (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {profileFields.map(([label, field]) => (
              <div key={field} className="flex items-center justify-between gap-3 border-b border-[#d8afcc] pb-3">
                <dt className="text-sm font-semibold">{label}</dt>
                <dd className="text-right text-sm">{profileValue(field)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-[#684f6c]">Sign in to see your information.</p>
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

      {nextAppointment && <NextAppointmentBanner appointment={nextAppointment} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${panel} lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className={heading}>Upcoming Appointments</h2>
            <button type="button" onClick={() => onNavigate('My Appointments')} className={viewAll}>View all</button>
          </div>
          {upcomingAppointments.length > 0 ? (
            <ul className="space-y-2">
              {upcomingAppointments.slice(0, 3).map((a) => <AppointmentSummary key={a.id} appointment={a} />)}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-[#684f6c]">No upcoming appointments.</p>
          )}
        </section>

        <section className={panel}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className={heading}>Latest Notifications</h2>
            <button type="button" onClick={() => onNavigate('Notifications')} className={viewAll}>View all</button>
          </div>
          {notifications.length > 0 ? (
            <ul className="space-y-2">
              {notifications.slice(0, 3).map((n) => (
                <li key={n.id} className={`rounded-md p-3 ${n.read ? 'bg-[#e8c3da]' : 'bg-[#c58eb4] ring-2 ring-[#87577d]'}`}>
                  <p className="text-sm font-semibold text-[#392641]">{n.message}</p>
                  <p className="mt-1 text-xs text-[#684f6c]">{n.date}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-[#684f6c]">No notifications yet.</p>
          )}
        </section>
      </div>

      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        For emergencies, go to the clinic immediately.
      </div>

      <section className={`${panel} w-full`}>
        <h2 className={`${heading} mb-4`}>Quick Actions</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(['Request Schedule', 'My Appointments'] as InfirmaryTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="rounded-md bg-[#d8a6c7] px-4 py-3 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
            >
              {tab === 'Request Schedule' ? 'Request a Schedule' : tab}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}