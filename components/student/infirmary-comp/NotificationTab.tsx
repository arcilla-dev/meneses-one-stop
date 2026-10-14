'use client';

import { useState } from 'react';
import { Bell, Settings, Trash2 } from 'lucide-react';
import { registrarDisplayFont } from '../../../lib/infirmaryFonts';
import type { InfirmaryNotification } from '../../../lib/infirmaryData';

function NotificationItem({
  notification,
  onDelete,
  onMarkRead,
}: {
  notification: InfirmaryNotification;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const Icon = notification.type === 'certificate' ? Bell : Settings;

  function handleDelete() {
    if (isRemoving) return;
    setIsRemoving(true);
    window.setTimeout(() => onDelete(notification.id), 200);
  }

  return (
    <li
      className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-3 text-[#392641] transition-opacity duration-200 sm:px-5 sm:py-4 ${
        notification.read ? 'bg-[#e8c3da]' : 'bg-[#c58eb4] ring-2 ring-[#87577d]'
      } ${isRemoving ? 'opacity-0' : 'opacity-100'}`}
    >
      <button type="button" onClick={() => onMarkRead(notification.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Icon className="h-7 w-7 shrink-0 fill-[#d5a0c3] text-[#8c6895]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-tight sm:text-lg">{notification.message}</span>
          <span className="mt-1 block text-sm leading-tight text-[#684f6c]">{notification.date}</span>
        </span>
      </button>
      <button
        type="button"
        aria-label="Delete notification"
        title="Delete"
        onClick={handleDelete}
        disabled={isRemoving}
        className="shrink-0 rounded-full p-2 text-[#765f7a] transition hover:bg-red-100 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}

interface Props {
  notifications: InfirmaryNotification[];
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationsTab({ notifications, onDelete, onMarkRead, onClearAll }: Props) {
  const [isClearing, setIsClearing] = useState(false);

  function handleClearAll() {
    if (isClearing || !window.confirm('Delete all notifications?')) return;
    setIsClearing(true);
    window.setTimeout(() => {
      onClearAll();
      setIsClearing(false); // reset, otherwise later notifications would stay invisible (opacity-0)
    }, 200);
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
      <div className="relative mb-2 flex min-h-8 items-center justify-center">
        <h2 className={`${registrarDisplayFont.className} text-center text-[17px] leading-tight text-[#48305d]`}>Notifications</h2>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={isClearing}
            className="absolute right-0 rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
          >
            Clear all
          </button>
        )}
      </div>
      {notifications.length > 0 ? (
        <ul className={`space-y-1 transition-opacity duration-200 ${isClearing ? 'opacity-0' : 'opacity-100'}`}>
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onDelete={onDelete} onMarkRead={onMarkRead} />
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