'use client';

import { useMemo, useState } from 'react';
import { registrarDisplayFont } from '../../../lib/infirmaryFonts';
import type { Appointment, AppointmentStatus } from '../../../lib/infirmaryData';
import { appointmentDay, appointmentTimestamp, dayTimestamp } from '../../../lib/infirmaryUtils';
import AppointmentItem from './AppointmentItem';
import type { InfirmaryTab } from './InfirmaryHeader';

type Filter = 'All' | AppointmentStatus;
const filters: Filter[] = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];
const pastStatuses = new Set<AppointmentStatus>(['Cancelled', 'Rejected', 'Completed']);

interface Props {
  appointments: Appointment[];
  onCancelAppointment: (id: string) => void;
  onChangeAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  onTabChange: (tab: InfirmaryTab) => void;
}

export default function MyAppointmentsTab({ appointments, onCancelAppointment, onChangeAppointmentStatus, onTabChange }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const today = dayTimestamp(new Date());

  const statusCounts = useMemo(() => {
    const counts = {} as Record<Filter, number>;
    for (const filter of filters) {
      counts[filter] = filter === 'All' ? appointments.length : appointments.filter((a) => a.status === filter).length;
    }
    return counts;
  }, [appointments]);

  const filtered = appointments.filter((a) => activeFilter === 'All' || a.status === activeFilter);
  const isPast = (a: Appointment) => appointmentDay(a) < today || pastStatuses.has(a.status);
  const upcoming = filtered.filter((a) => !isPast(a)).sort((a, b) => appointmentTimestamp(a) - appointmentTimestamp(b));
  const past = filtered.filter(isPast).sort((a, b) => appointmentTimestamp(b) - appointmentTimestamp(a));

  function renderGroup(title: string, group: Appointment[]) {
    if (group.length === 0) return null;
    return (
      <section className="mt-4 first:mt-0">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#684f6c]">{title}</h3>
        <ul className="space-y-2">
          {group.map((a) => (
            <AppointmentItem key={a.id} appointment={a} onCancel={onCancelAppointment} onChangeStatus={onChangeAppointmentStatus} />
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
      <h2 className={`${registrarDisplayFont.className} mb-3 text-center text-[17px] leading-tight text-[#48305d]`}>My Appointments</h2>
      {appointments.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center text-center text-[#48305d]">
          <p className="text-lg font-semibold">No appointments yet.</p>
          <button
            type="button"
            onClick={() => onTabChange('Request Schedule')}
            className="mt-3 rounded-md bg-[#d8a6c7] px-4 py-2 text-sm font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
          >
            Request a Schedule
          </button>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filter appointments by status" className="mb-4 flex flex-wrap gap-1 rounded-md bg-[#e8c3da] p-1">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  activeFilter === filter ? 'bg-[#87577d] text-white shadow-sm' : 'text-[#48305d] hover:bg-[#d8a6c7]'
                }`}
              >
                {filter} ({statusCounts[filter]})
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center text-center text-[#48305d]">
              <p className="text-base font-semibold">No {activeFilter.toLowerCase()} appointments.</p>
            </div>
          ) : (
            <>
              {renderGroup('Upcoming', upcoming)}
              {renderGroup('Past', past)}
            </>
          )}
        </>
      )}
    </section>
  );
}