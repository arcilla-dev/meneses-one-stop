"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  FileSignature,
  GraduationCap,
  PlusSquare,
  Users,
  Search,
} from "lucide-react";
import { Dela_Gothic_One } from "next/font/google";
import Image from "next/image";

// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

type Filters = "Unread" | "Marked as Important";
type TabOption = "All" | Filters;

const TABS: TabOption[] = ["All", "Unread", "Marked as Important"];

interface NotificationItem {
  id: number | string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_important: boolean;
  notification_type: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  scholarship: GraduationCap,
  infirmary: PlusSquare,
  cor: FileSignature,
  printing: Users,
};

const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

/* ---------- Shared UI tokens (identical across all pages) ---------- */
const NAV_BTN =
  "flex h-14 w-full items-center justify-center rounded-lg border-2 border-[#956084] px-3 text-center text-sm leading-tight tracking-wide shadow-sm transition hover:brightness-105 active:scale-95 md:h-16 md:text-base";
const TAB_INACTIVE = "bg-[#D8ABCA] text-[#39265f]";
const TAB_ACTIVE =
  "bg-[#956084] text-white ring-2 ring-offset-2 ring-[#39265f]/30";
const ACTION_BTN =
  "h-12 rounded-lg border-2 border-[#39265f] bg-[#39265f] px-5 text-sm tracking-wide text-white shadow-sm transition hover:bg-[#503778] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:h-14 md:px-6 md:text-base";
const CARD_TITLE = "text-base font-bold text-[#39265f] sm:text-lg";
const CARD_TEXT = "text-sm text-[#6d5b7a]";
const ICON_BADGE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#956084] bg-[#c48ab2]/70 sm:h-14 sm:w-14";

const timeAgo = (iso: string) => {
  const minutes = Math.floor(
    Math.max(0, Date.now() - new Date(iso).getTime()) / 60000
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildMockNotifications = (): NotificationItem[] => {
  const hoursAgo = (h: number) =>
    new Date(Date.now() - h * 3600 * 1000).toISOString();

  return [
    {
      id: 1,
      title: "Scholarship Application Open",
      message:
        "Applications for the academic scholarship are now open until the end of the month.",
      created_at: hoursAgo(2),
      is_read: true,
      is_important: false,
      notification_type: "scholarship",
    },
    {
      id: 2,
      title: "Infirmary Service Update",
      message: "The infirmary will operate on adjusted hours this week.",
      created_at: hoursAgo(4),
      is_read: true,
      is_important: false,
      notification_type: "infirmary",
    },
    {
      id: 3,
      title: "COR Now Available",
      message: "Your Certificate of Registration is ready for download.",
      created_at: hoursAgo(26),
      is_read: false,
      is_important: true,
      notification_type: "cor",
    },
    {
      id: 4,
      title: "COR Request Approved",
      message: "Your COR request has been approved by the Registrar.",
      created_at: hoursAgo(28),
      is_read: true,
      is_important: false,
      notification_type: "cor",
    },
    {
      id: 5,
      title: "Scholarship Application Open",
      message: "A second scholarship batch is accepting applications.",
      created_at: hoursAgo(50),
      is_read: false,
      is_important: true,
      notification_type: "scholarship",
    },
    {
      id: 6,
      title: "LSC Printing Services",
      message:
        "Printing services are available at the LSC office on weekdays.",
      created_at: hoursAgo(52),
      is_read: false,
      is_important: false,
      notification_type: "printing",
    },
  ];
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabOption>("All");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);

      // Supabase version:
      // const { data: { user } } = await supabase.auth.getUser();
      // const { data, error } = await supabase
      //   .from("notifications")
      //   .select("*")
      //   .eq("user_id", user?.id)
      //   .order("created_at", { ascending: false });
      //
      // if (error) {
      //   console.error(error.message);
      // } else {
      //   setNotifications(data as NotificationItem[]);
      // }

      await new Promise((resolve) => setTimeout(resolve, 200));
      setNotifications(buildMockNotifications());
      setLoading(false);
    };

    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const importantCount = notifications.filter((n) => n.is_important).length;

  const countFor = (tab: TabOption) =>
    tab === "All"
      ? notifications.length
      : tab === "Unread"
        ? unreadCount
        : importantCount;

  const filteredNotifications = useMemo(() => {
    const q = query.trim().toLowerCase();

    return notifications.filter((n) => {
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Unread" && !n.is_read) ||
        (activeTab === "Marked as Important" && n.is_important);

      const matchesQuery =
        q === "" ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);

      return matchesTab && matchesQuery;
    });
  }, [notifications, activeTab, query]);

  const markAsRead = (id: NotificationItem["id"]) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Background logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 h-0"
      >
        <div className="absolute left-0 top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <img
            src="/icons/notif-bg.png"
            alt=""
            className="h-[90vh] w-auto max-w-none -translate-y-[4%] select-none opacity-25"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 text-[#39265f]">
          <Image
            src="/icons/notification-icon.png"
            alt="Notifications"
            width={56}
            height={56}
            className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          />

          <div>
            <h1
              className={`${delaGothicOne.className} text-3xl tracking-wide md:text-5xl`}
            >
              Notifications
            </h1>

            <p
              className="mt-1 text-sm tracking-widest text-[#6d5b7a]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Personal alerts and system updates
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-4 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-4 flex gap-1 text-[#39265f]">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Tabs and search */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-6 md:gap-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`${delaGothicOne.className} ${NAV_BTN} ${
                activeTab === tab ? TAB_ACTIVE : TAB_INACTIVE
              }`}
            >
              {tab} ({countFor(tab)})
            </button>
          ))}

          <button
            type="button"
            aria-label="Search notifications"
            aria-pressed={showSearch}
            onClick={() => {
              setShowSearch((prev) => !prev);
              if (showSearch) setQuery("");
            }}
            className={`${NAV_BTN} ${
              showSearch ? TAB_ACTIVE : TAB_INACTIVE
            }`}
          >
            <Search size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search input */}
        {showSearch && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications..."
            autoFocus
            className="mb-4 w-full rounded-lg border-2 border-[#956084] bg-[#fff0f6]/90 px-4 py-3 text-base text-[#39265f] placeholder:text-[#6d5b7a]/70 focus:outline-none focus:ring-2 focus:ring-[#956084]/50"
          />
        )}

        {/* Notifications list */}
        {loading ? (
          <p className="py-8 text-center text-[#6d5b7a]">
            Loading notifications...
          </p>
        ) : filteredNotifications.length === 0 ? (
          <p className="py-8 text-center text-[#6d5b7a]">
            {query.trim() !== ""
              ? "No notifications match your search."
              : `No ${
                  activeTab === "Unread"
                    ? "unread "
                    : activeTab === "Marked as Important"
                      ? "important "
                      : ""
                }notifications yet.`}
          </p>
        ) : (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1 sm:pr-2">
            {filteredNotifications.map((item) => {
              const Icon = getIconForType(item.notification_type);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border-2 p-3 text-left shadow-sm transition hover:brightness-[0.98] active:scale-[0.99] sm:gap-4 sm:p-4 ${
                    item.is_read
                      ? "border-[#c48ab2] bg-[#fbe6f0]/90"
                      : "border-[#956084] bg-[#dfb5d1]/90"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className={`relative ${ICON_BADGE}`}>
                      <Icon size={24} className="text-[#39265f] sm:h-7 sm:w-7" />

                      {!item.is_read && (
                        <span
                          aria-label="Unread"
                          className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#ffd9e8] bg-[#b83250]"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <h3
                        className={`mb-1 truncate ${CARD_TITLE}`}
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>

                      <p className={`line-clamp-2 ${CARD_TEXT}`}>
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 self-start text-right text-xs font-semibold text-[#39265f] sm:text-sm">
                    {timeAgo(item.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mark all as read */}
        {!loading && notifications.length > 0 && (
          <div className="mt-4 flex justify-end pb-8">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`${delaGothicOne.className} ${ACTION_BTN}`}
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}