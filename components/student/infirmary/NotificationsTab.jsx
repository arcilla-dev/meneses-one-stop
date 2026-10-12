"use client";

import { useState } from "react";
import { registrarDisplayFont } from "../registrar/fonts";
import NotificationItem from "./NotificationItem";

export default function NotificationsTab({
  notifications,
  onDelete,
  onMarkRead,
  onClearAll,
}) {
  const [isClearing, setIsClearing] = useState(false);

  function handleClearAll() {
    if (isClearing || !window.confirm("Delete all notifications?")) return;

    setIsClearing(true);
    window.setTimeout(onClearAll, 200);
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-3.5 shadow-sm">
      <div className="relative mb-2 flex min-h-8 items-center justify-center">
        <h2
          className={`${registrarDisplayFont.className} text-center text-[17px] leading-tight text-[#48305d]`}
        >
          Notifications
        </h2>
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
        <ul
          className={`space-y-1 transition-opacity duration-200 ${
            isClearing ? "opacity-0" : "opacity-100"
          }`}
        >
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDelete={onDelete}
              onMarkRead={onMarkRead}
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
