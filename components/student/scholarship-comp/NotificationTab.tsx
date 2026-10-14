'use client';

import { Trash2 } from 'lucide-react';
import { registrarDisplayFont } from '../../../lib/scholarshipFonts';
import type { ScholarshipNotification } from '../../../lib/scholarshipData';
import { formatDisplayDate } from '../../../lib/scholarshipUtils';

interface Props {
  notifications: ScholarshipNotification[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsTab({ notifications, onMarkRead, onDelete, onClearAll }: Props) {
  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className={`${registrarDisplayFont.className} text-[17px] leading-tight text-[#48305d]`}>Notifications</h2>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={() => window.confirm('Delete all notifications?') && onClearAll()}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
          >
            Clear all
          </button>
        )}
      </div>
      {notifications.length > 0 ? (
        <ul className="space-y-1">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 rounded-md px-5 py-4 text-[#392641] ${
                n.read ? 'bg-[#e8c3da]' : 'bg-[#c58eb4] ring-2 ring-[#87577d]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-sm">{n.message}</p>
                <p className="mt-1 text-xs text-[#684f6c]">{formatDisplayDate(n.date)}</p>
              </div>
              <button
                type="button"
                aria-label="Delete notification"
                title="Delete"
                onClick={() => onDelete(n.id)}
                className="shrink-0 rounded-full p-2 text-[#765f7a] transition hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
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
  );
}