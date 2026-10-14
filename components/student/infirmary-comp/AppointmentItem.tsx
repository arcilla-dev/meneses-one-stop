'use client';

import { useState } from 'react';
import { SERVICE_ICONS, statusStyles, type Appointment, type AppointmentStatus } from '../../../lib/infirmaryData';
import { formatDisplayDate, formatTimeRange } from '../../../lib/infirmaryUtils';

interface Props {
  appointment: Appointment;
  onCancel: (id: string) => void;
  /** Dev-only: in production the CLINIC approves/rejects, not the student */
  onChangeStatus: (id: string, status: AppointmentStatus) => void;
}

export default function AppointmentItem({ appointment, onCancel, onChangeStatus }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);
  const Icon = SERVICE_ICONS[appointment.service] ?? SERVICE_ICONS.Other;
  const isPending = appointment.status === 'Pending';
  const canCancel = isPending || appointment.status === 'Approved';

  function handleCancel() {
    if (isUpdating || !window.confirm('Cancel this appointment?')) return;
    setIsUpdating(true);
    onCancel(appointment.id);
  }

  function handleStatusChange(status: AppointmentStatus) {
    if (isUpdating) return;
    setIsUpdating(true);
    onChangeStatus(appointment.id, status);
  }

  return (
    <li className="rounded-md bg-[#e8c3da] px-4 py-3 text-[#392641]">
      <div className="flex flex-wrap items-center gap-3">
        <Icon className="h-7 w-7 shrink-0 text-[#8c6895]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{appointment.service}</p>
          <p className="text-sm text-[#684f6c]">
            {formatDisplayDate(appointment.date)} &bull; {formatTimeRange(appointment.timeStart, appointment.timeEnd)}
          </p>
          {appointment.remarks && appointment.status !== 'Rejected' && (
            <p className="mt-1 text-xs text-[#684f6c]">Remarks: {appointment.remarks}</p>
          )}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[appointment.status]}`}>{appointment.status}</span>
        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUpdating}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        {isPending && process.env.NODE_ENV === 'development' && (
          <span className="flex items-center gap-1">
            <span className="sr-only">Dev only:</span>
            <button type="button" onClick={() => handleStatusChange('Approved')} disabled={isUpdating} className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200 disabled:opacity-50">
              Approve
            </button>
            <button type="button" onClick={() => handleStatusChange('Rejected')} disabled={isUpdating} className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">
              Reject
            </button>
            <span className="text-[10px] font-semibold text-[#684f6c]">(dev only)</span>
          </span>
        )}
      </div>
      {appointment.status === 'Rejected' && appointment.remarks && (
        <p className="mt-2 pl-10 text-sm font-medium text-red-700">Reason: {appointment.remarks}</p>
      )}
    </li>
  );
}