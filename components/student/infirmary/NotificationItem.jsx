import { Bell, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

export default function NotificationItem({ notification, onDelete, onMarkRead }) {
  const [isRemoving, setIsRemoving] = useState(false);
  const Icon = notification.type === "certificate" ? Bell : Settings;

  function handleDelete(event) {
    event.stopPropagation();
    if (isRemoving) return;

    setIsRemoving(true);
    window.setTimeout(() => onDelete(notification.id), 200);
  }

  return (
    <li
      className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-3 text-[#392641] transition-opacity duration-200 sm:px-5 sm:py-4 ${
        notification.read ? "bg-[#e8c3da]" : "bg-[#c58eb4] ring-2 ring-[#87577d]"
      } ${isRemoving ? "opacity-0" : "opacity-100"}`}
    >
      <button
        type="button"
        onClick={() => onMarkRead(notification.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Icon
          className="h-7 w-7 shrink-0 fill-[#d5a0c3] text-[#8c6895]"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-tight sm:text-lg">
            {notification.message}
          </span>
          <span className="mt-1 block text-sm leading-tight text-[#684f6c]">
            {notification.date}
          </span>
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
