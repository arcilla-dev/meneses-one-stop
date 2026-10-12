"use client";

import { registrarDisplayFont } from "./fonts";
import NotificationItem from "./NotificationItem";

export default function NotificationsTab({ notifications, onDelete, onClearAll }) {
  function handleClearAll() {
    if (window.confirm("Delete all notifications?")) {
      onClearAll();
    }
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className={`${registrarDisplayFont.className} text-[17px] leading-tight text-[#48305d]`}>
          Notifications
        </h2>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#684f6c] transition-colors hover:bg-[#e8c3da] hover:text-[#48305d]"
          >
            Clear all
          </button>
        )}
      </div>
      {notifications.length > 0 ? (
        <ul className="space-y-1">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDelete={onDelete}
            />
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
