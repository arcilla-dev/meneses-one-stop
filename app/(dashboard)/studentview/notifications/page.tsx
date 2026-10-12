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
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

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

// Tab button colors: every tab shares the inactive color; the selected one is darker.
const TAB_INACTIVE = "bg-[#D8ABCA] text-white";
const TAB_ACTIVE = "bg-[#C48AB2] text-white ring-2 ring-offset-2 ring-[#39265f]/30";

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
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FEEAEE]">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[#402A5D]">
            <Bell size={48} strokeWidth={1.5} className="fill-[#402A5D] text-[#402A5D]" />
            <div>
              <h1 className="text-5xl font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
                Notifications
              </h1>
            </div>
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-4 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
        </div>

        {/* Tabs Section + Search toggle */}
        <div className="flex gap-4 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-lg shadow-sm transition-transform hover:scale-105 active:scale-95 ${
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
            className={`shrink-0 w-14 flex items-center justify-center rounded-xl shadow-sm transition-transform hover:scale-105 active:scale-95 ${
              showSearch ? TAB_ACTIVE : TAB_INACTIVE
            }`}
          >
            <Search size={24} strokeWidth={2.5} />
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
            className="w-full mb-4 px-4 py-3 rounded-xl bg-[#f4e1eb] border border-[#d3bbcc] text-[#39265f] placeholder:text-[#5a4a75]/70 focus:outline-none focus:border-[#9b51e0]"
          />
        )}

        {/* List Section */}
        {loading ? (
          <p className="text-center text-[#5a4a75] py-8">Loading notifications...</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-center text-[#5a4a75] py-8">
            {query.trim() !== ""
              ? "No notifications match your search."
              : `No ${activeTab === "Unread" ? "unread " : activeTab === "Marked as Important" ? "important " : ""}notifications yet.`}
          </p>
        ) : (
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {filteredNotifications.map((item) => {
              const Icon = getIconForType(item.notification_type);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className={`w-full text-left flex items-center justify-between gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:border-[#9b51e0] ${
                    item.is_read
                      ? "bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] border border-[#d3bbcc]"
                      : "bg-gradient-to-r from-[#d9b8d0] to-[#e3c6da] border-2 border-[#39265f]/80"
                  }`}
                >
                  {/* Left Side: Icon & Details */}
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="relative shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] flex items-center justify-center shadow-inner">
                      <Icon size={28} className="text-[#e2d5e3]" />
                      {!item.is_read && (
                        <span
                          aria-label="Unread"
                          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#f53c3d] border-2 border-[#feeaee]"
                        />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <h3
                        className="text-[1.15rem] font-bold text-[#39265f] mb-0.5 truncate"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#5a4a75] truncate">{item.message}</p>
                    </div>
                  </div>

                  {/* Right Side: Relative time */}
                  <span className="shrink-0 text-sm font-bold text-[#39265f]">
                    {timeAgo(item.created_at)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mark all as read */}
        {!loading && notifications.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-5 py-3 rounded-xl font-bold text-white bg-[#39265f] shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
