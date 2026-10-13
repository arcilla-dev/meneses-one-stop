"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Announcement,
  LSCNotification,
  PrintRequest,
  PrintRequestDraft,
  RequestStatus,
} from "@/lib/lscData";
import * as api from "@/lib/lscApi";
import LSCHeader, { type LSCTab } from "@/components/lsc-comp/LscHeader";
import OverviewTab from "@/components/lsc-comp/OverviewTab";
import ServicesTab from "@/components/lsc-comp/ServiceTab";
import MyRequestsTab from "@/components/lsc-comp/RequestTab";
import AnnouncementsTab from "@/components/lsc-comp/AnnouncementTab";
import NotificationsTab from "@/components/lsc-comp/NotificationTab";

export default function StudentLSC() {
  const [activeTab, setActiveTab] = useState<LSCTab>("overview");
  const [printRequests, setPrintRequests] = useState<PrintRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<LSCNotification[]>([]);
  const [loadError, setLoadError] = useState("");

  // ---------- Load from Supabase ----------

  const loadAll = useCallback(async () => {
    try {
      const [requests, news, notifs] = await Promise.all([
        api.fetchPrintRequests(),
        api.fetchAnnouncements(),
        api.fetchNotifications(),
      ]);
      setPrintRequests(requests);
      setAnnouncements(news);
      setNotifications(notifs);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load your LSC data.");
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---------- Notifications ----------
  // Created by database triggers (submitted, printing, ready, claimed, cancelled),
  // so the page never inserts them itself.

  function markNotificationRead(id: string) {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.markNotificationRead(id).catch(() => loadAll());
  }

  function deleteNotification(id: string) {
    setNotifications((current) => current.filter((n) => n.id !== id));
    api.deleteNotification(id).catch(() => loadAll());
  }

  function clearNotifications() {
    setNotifications([]);
    api.clearNotifications().catch(() => loadAll());
  }

  // ---------- Tabs ----------

  function handleTabChange(tab: LSCTab) {
    setActiveTab(tab);
    if (tab === "announcements") {
      const unreadIds = announcements.filter((a) => !a.read).map((a) => a.id);
      setAnnouncements((current) => current.map((a) => ({ ...a, read: true })));
      api.markAnnouncementsRead(unreadIds).catch(() => loadAll());
    }
  }

  // ---------- Print requests ----------

  // Throws Error(message) on failure; the form shows it.
  async function addPrintRequest(draft: PrintRequestDraft): Promise<PrintRequest> {
    const printRequest = await api.submitPrintRequest(draft);
    await loadAll(); // refreshes the list and picks up the trigger's notification
    return printRequest;
  }

  async function cancelPrintRequest(requestId: string): Promise<void> {
    await api.cancelPrintRequest(requestId); // the database enforces "Pending only"
    await loadAll();
  }

  // Dev-only "Advance status" button. Students can't change status; the LSC side does.
  async function updatePrintRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
    const dbStatus = status === "Ready for claiming" ? "ready" : status.toLowerCase();
    console.info(
      `Status changes are done on the LSC side. In Supabase run: update print_requests set status = '${dbStatus}' where id = '${requestId}';`,
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <LSCHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadNotifications={unreadNotifications}
        />

        {loadError && (
          <p role="alert" className="mx-auto w-full max-w-5xl rounded-md bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
            {loadError}
          </p>
        )}

        <div className="mx-auto mt-8 min-h-[400px] w-full max-w-5xl px-4">
          {activeTab === "overview" && (
            <OverviewTab printRequests={printRequests} announcements={announcements} onNavigate={handleTabChange} />
          )}
          {activeTab === "services" && <ServicesTab printRequests={printRequests} onSubmit={addPrintRequest} />}
          {activeTab === "myRequests" && (
            <MyRequestsTab
              printRequests={printRequests}
              onCancel={cancelPrintRequest}
              onUpdateStatus={updatePrintRequestStatus}
              onNavigate={handleTabChange}
            />
          )}
          {activeTab === "announcements" && <AnnouncementsTab announcements={announcements} />}
          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onDelete={deleteNotification}
              onClearAll={clearNotifications}
            />
          )}
        </div>
      </div>
    </main>
  );
}