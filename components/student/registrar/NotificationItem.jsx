import { Settings, Trash2 } from "lucide-react";

export default function NotificationItem({ notification, onDelete }) {
  return (
    <li
      className={`flex min-h-10 items-center gap-3 rounded-md px-5 py-4 text-[#392641] transition-opacity duration-200 ${
        notification.isRead ? "bg-[#e8c3da]" : "bg-[#c58eb4] ring-2 ring-[#87577d]"
      }`}
    >
      <Settings className="h-7 w-7 shrink-0 fill-[#d5a0c3] text-[#8c6895]" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold leading-tight">{notification.message}</p>
        <p className="mt-1 text-sm leading-tight text-[#684f6c]">{notification.date}</p>
      </div>
      <button
        type="button"
        aria-label="Delete notification"
        title="Delete"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(notification.id);
        }}
        className="shrink-0 rounded-full p-2 text-[#765f7a] transition hover:bg-red-100 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}
