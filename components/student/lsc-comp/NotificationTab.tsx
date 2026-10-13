"use client";

import { Trash2 } from "lucide-react";
import type { LSCNotification } from "../../../lib/lscData";
import { formatDisplayDate } from "../../../lib/lscUtils";

interface NotificationsTabProps {
  notifications: LSCNotification[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsTab({
  notifications,
  onMarkRead,
  onDelete,
  onClearAll,
}: NotificationsTabProps) {
  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold leading-tight text-[#48305d]">
          Notifications
        </h2>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#684f6c]">
          No notifications yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 rounded-md p-4 ${
                n.read ? "bg-[#f8e5f0]" : "bg-[#e8c3da]"
              }`}
            >
              <button
                type="button"
                onClick={() => onMarkRead(n.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex flex-wrap items-start justify-between gap-2">
                  <span
                    className={`text-[#48305d] ${n.read ? "font-semibold" : "font-bold"}`}
                  >
                    {!n.read && (
                      <span
                        aria-label="Unread"
                        className="mr-2 inline-block h-2 w-2 rounded-full bg-[#8c6895]"
                      />
                    )}
                    {n.title}
                  </span>
                  <time dateTime={n.date} className="text-xs text-[#684f6c]">
                    {formatDisplayDate(n.date)}
                  </time>
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-[#684f6c]">
                  {n.message}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Delete notification: ${n.title}`}
                onClick={() => onDelete(n.id)}
                className="shrink-0 rounded-full p-1.5 text-[#765f7a] transition hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}