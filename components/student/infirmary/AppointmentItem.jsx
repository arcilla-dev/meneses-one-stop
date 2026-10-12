import { useState } from "react";
import { SERVICE_ICONS } from "./data";

const statusStyles = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-200 text-gray-700",
  Completed: "bg-purple-200 text-purple-800",
};

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

export default function AppointmentItem({
  appointment,
  onCancel,
  onChangeStatus,
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const Icon = SERVICE_ICONS[appointment.service] ?? SERVICE_ICONS.Other;
  const timeRange = formatTimeRange(appointment.timeStart, appointment.timeEnd);
  const isPending = appointment.status === "Pending";
  const canCancel = isPending || appointment.status === "Approved";

  function handleCancel() {
    if (isUpdating || !window.confirm("Cancel this appointment?")) return;
    setIsUpdating(true);
    onCancel(appointment.id);
  }

  function handleStatusChange(status) {
    if (isUpdating) return;
    setIsUpdating(true);
    onChangeStatus(appointment.id, status);
  }

  return (
    <li className="rounded-md bg-[#e8c3da] px-4 py-3 text-[#392641]">
      <div className="flex flex-wrap items-center gap-3">
        <Icon
          className="h-7 w-7 shrink-0 text-[#8c6895]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{appointment.service}</p>
          <p className="text-sm text-[#684f6c]">
            {appointment.date} &bull; {timeRange}
          </p>
          {appointment.remarks && appointment.status !== "Rejected" && (
            <p className="mt-1 text-xs text-[#684f6c]">
              Remarks: {appointment.remarks}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            statusStyles[appointment.status] ?? statusStyles.Pending
          }`}
        >
          {appointment.status}
        </span>
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
        {isPending && process.env.NODE_ENV === "development" && (
          <span className="flex items-center gap-1">
            <span className="sr-only">Dev only:</span>
            <button
              type="button"
              onClick={() => handleStatusChange("Approved")}
              disabled={isUpdating}
              className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 hover:bg-green-200 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("Rejected")}
              disabled={isUpdating}
              className="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              Reject
            </button>
            <span className="text-[10px] font-semibold text-[#684f6c]">
              (dev only)
            </span>
          </span>
        )}
      </div>
      {appointment.status === "Rejected" && appointment.remarks && (
        <p className="mt-2 pl-10 text-sm font-medium text-red-700">
          Reason: {appointment.remarks}
        </p>
      )}
    </li>
  );
}
