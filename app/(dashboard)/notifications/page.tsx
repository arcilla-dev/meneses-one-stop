"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
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
  created_at: string; // ISO timestamp — relative time ("2h ago") is derived from this
  is_read: boolean;
  is_important: boolean;
  notification_type: string; // used to pick an icon
}

// Maps notification_type to a lucide icon (same pattern as requests/page.tsx).
const ICON_MAP: Record<string, React.ElementType> = {
  scholarship: GraduationCap,
  infirmary: PlusSquare,
  cor: FileSignature,
  printing: Users,
};

const getIconForType = (type: string) => ICON_MAP[type] ?? FileText;

// Tab colors (same palette as the Requests page filters)
const TAB_COLORS: Record<TabOption, string> = {
  All: "bg-[#956084] text-white",
  Unread: "bg-[#b477a1] text-white",
  "Marked as Important": "bg-[#b477a1] text-white",
};

// Search button colors
const SEARCH_IDLE = "bg-[#b477a1] text-white";
const SEARCH_ACTIVE = "bg-[#956084] text-white";

const RING_ACTIVE = "ring-2 ring-[#39265f]/40 ring-offset-2 ring-offset-[#ffd9e8]";

const timeAgo = (iso: string) => {
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
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

// --- Mock data (stand-in for a Supabase table named "notifications") ---
// Expected real columns: id, user_id, title, message, created_at, is_read, is_important, notification_type
const buildMockNotifications = (): NotificationItem[] => {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  return [
    {
      id: 1,
      title: "Scholarship Application Open",
      message: "Applications for the academic scholarship are now open until the end of the month.",
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
      message: "Printing services are available at the LSC office on weekdays.",
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

      // --- Supabase version (uncomment and delete the mock block below when ready) ---
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

      // --- Mock version (remove once Supabase is wired up) ---
      await new Promise((resolve) => setTimeout(resolve, 200));
      setNotifications(buildMockNotifications());

      setLoading(false);
    };

    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const importantCount = notifications.filter((n) => n.is_important).length;

  const countFor = (tab: TabOption) =>
    tab === "All" ? notifications.length : tab === "Unread" ? unreadCount : importantCount;

  const filteredNotifications = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchesTab =
        activeTab === "All" ||
        (activeTab === "Unread" && !n.is_read) ||
        (activeTab === "Marked as Important" && n.is_important);
      const matchesQuery =
        q === "" || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [notifications, activeTab, query]);

  const markAsRead = (id: NotificationItem["id"]) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    // TODO (Supabase): await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // TODO (Supabase): await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  };

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Faded campus logo background */}
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
        {/* Header Section */}
        <div className="flex items-center gap-3 text-[#39265f] md:gap-4">
            <Image
              src="/icons/notification-icon.png"
              alt="Notification"
              width={45}
              height={45}
              className="h-13 w-13 object-contain sm:h-14 sm:w-14"
            />
          <div>
            <h1
              className={`${delaGothicOne.className} text-2xl tracking-wide sm:text-3xl md:text-4xl xl:text-5xl`}
            >
              Notifications
            </h1>
            <p
              className="mt-1 text-xs tracking-wide text-[#6d5b7a] sm:text-sm md:tracking-widest"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Personal alerts and system update.
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-5 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-3 flex gap-1 text-[#39265f] md:mx-4">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Tabs Section + Search toggle */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-6 md:gap-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`${delaGothicOne.className} rounded-xl border-2 border-[#39265f]/40 px-3 py-3 text-xs shadow-sm transition hover:brightness-105 active:scale-95 sm:text-sm md:py-4 ${
                  TAB_COLORS[tab]
              } ${activeTab === tab ? RING_ACTIVE : "opacity-90"}`}
            >
              {tab}
              <span className="ml-2 font-sans text-xs">{countFor(tab)}</span>
            </button>
          ))}

          <button type="button" aria-label="Search notifications" aria-pressed={showSearch} onClick={() => { setShowSearch((prev) => !prev); if (showSearch) setQuery(""); }} className={`flex aspect-square w-12 shrink-0 items-center justify-center self-center justify-self-center rounded-xl shadow-sm transition hover:brightness-105 active:scale-95 sm:w-14 md:w-16 ${ showSearch ? `${SEARCH_ACTIVE} ${RING_ACTIVE}` : `${SEARCH_IDLE} opacity-90` }`} > 
            <Search size={22} 
            strokeWidth={2.5} /> 
          </button>
        </div>

        {/* Search input (revealed by the search button) */}
        {showSearch && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications..."
            autoFocus
            className="mb-4 w-full rounded-xl border border-[#c48ab2] bg-[#dfb5d1]/70 px-4 py-3 text-[#39265f] placeholder:text-[#5a4a75]/70 focus:border-[#956084] focus:outline-none md:mb-6"
          />
        )}

        {/* List Section */}
        {loading ? (
          <p className="py-8 text-center text-[#6d5b7a]">Loading notifications...</p>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-[#c48ab2] bg-[#dfb5d1]/70 px-4 py-10 text-center shadow-sm">
            <Bell
              size={40}
              className="mx-auto mb-3 text-[#956084]"
              strokeWidth={1.5}
            />
            <p
              className="text-lg font-bold text-[#39265f]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {query.trim() !== ""
                ? "No notifications match your search."
                : `No ${activeTab === "Unread" ? "unread " : activeTab === "Marked as Important" ? "important " : ""}notifications yet.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4 md:gap-4">
            {filteredNotifications.map((item) => {
              const Icon = getIconForType(item.notification_type);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left shadow-sm transition duration-200 hover:border-[#956084] hover:shadow-md active:scale-[0.99] sm:p-4 md:gap-5 ${
                    item.is_read
                      ? "border border-[#c48ab2] bg-gradient-to-r from-[#dfb5d1]/90 via-[#d4a9c8]/85 to-[#a991b8]/85"
                      : "border-2 border-[#39265f]/80 bg-gradient-to-r from-[#d3a0c3]/95 via-[#c994bb]/90 to-[#9a80ad]/90"
                  }`}
                >
                  {/* Left Side: Icon & Details */}
                  <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-[#b477a1] to-[#6d5b7a] shadow-inner sm:h-14 sm:w-14">
                      <Icon
                        size={25}
                        strokeWidth={1.8}
                        className="text-white sm:h-7 sm:w-7"
                      />
                      {!item.is_read && (
                        <span
                          aria-label="Unread"
                          className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#ffd9e8] bg-[#f53c3d]"
                        />
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <h3
                        className="mb-0.5 truncate text-base font-bold text-[#39265f] sm:text-lg md:text-xl"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className="truncate text-xs text-[#5a4a75] sm:text-sm">{item.message}</p>
                    </div>
                  </div>

                  {/* Right Side: Relative time */}
                  <span className="shrink-0 text-xs font-bold text-[#39265f] sm:text-sm">
                    {timeAgo(item.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mark all as read */}
        {!loading && notifications.length > 0 && (
          <div className="mt-2 flex justify-end pb-8">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="rounded-xl border border-[#39265f]/30 bg-[#956084] px-5 py-3 font-bold text-white shadow-md transition hover:bg-[#80506f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#956084] disabled:active:scale-100"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}