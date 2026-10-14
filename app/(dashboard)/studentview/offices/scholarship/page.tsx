'use client';

import { MOCK_SCHOLARSHIPS } from '@/lib/scholarshipData';
console.log(JSON.stringify(MOCK_SCHOLARSHIPS));
import { useCallback, useEffect, useState } from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import * as api from '@/lib/scholarshipApi';
import ApplicationsTab from '@/components/student/scholarship-comp/ApplicationTab';
import NotificationsTab from '@/components/student/scholarship-comp/NotificationTab';
import OverviewTab from '@/components/student/scholarship-comp/OverviewTab';
import ScholarshipHeader from '@/components/student/scholarship-comp/ScholarshipHeader';
import ScholarshipListTab from '@/components/student/scholarship-comp/ScholarshipListTab';

type ScholarshipTab = 'overview' | 'notifications' | 'scholarshipList' | 'myApplications';

function ScholarshipContent() {
  const [activeTab, setActiveTab] = useState<ScholarshipTab>('overview');
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');

  /* ---------------- load from Supabase ---------------- */

  const loadAll = useCallback(async () => {
    try {
      const [schol, apps, notifs] = await Promise.all([
        api.fetchScholarships(),
        api.fetchApplications(),
        api.fetchNotifications(),
      ]);
      setScholarships(schol);
      setApplications(apps);
      setNotifications(notifs);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your scholarship data.');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ---------------- applications ---------------- */
  // The database sets the application ID and status, blocks duplicate
  // applications, and creates the notification with a trigger.

  async function submitApplication(draft: any) {
    const application = await api.submitApplication(draft); // throws -> shown in the form
    await loadAll();
    return application;
  }

  // Dev-only buttons. Students can't change status; the scholarship office does.
  function updateApplicationStatus(id: string, status: string, remarks = '') {
    console.info(
      `Status changes are done by the scholarship office. In Supabase run: update applications set status = '${status.toLowerCase()}', remarks = '${remarks}' where id = '${id}';`,
    );
  }

  /* ---------------- notifications ---------------- */

  function markNotificationRead(id: string) {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.markNotificationRead(id).catch(() => loadAll());
  }

  function deleteNotification(id: string) {
    setNotifications((current) => current.filter((n) => n.id !== id));
    api.deleteNotification(id).catch(() => loadAll());
  }

  function clearAllNotifications() {
    setNotifications([]);
    api.clearNotifications().catch(() => loadAll());
  }

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <ScholarshipHeader activeTab={activeTab} onTabChange={setActiveTab} />

        {loadError && (
          <p role="alert" className="mx-auto w-full max-w-5xl rounded-md bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
            {loadError}
          </p>
        )}

        <div className="mx-auto mt-8 min-h-[400px] w-full max-w-5xl px-4">
          {activeTab === 'overview' && (
            <OverviewTab scholarships={scholarships} applications={applications} onNavigate={setActiveTab} />
          )}
          {activeTab === 'scholarshipList' && (
            <ScholarshipListTab
              scholarships={scholarships}
              applications={applications}
              onSubmitApplication={submitApplication}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'myApplications' && (
            <ApplicationsTab
              applications={applications}
              onNavigate={setActiveTab}
              onUpdateStatus={updateApplicationStatus}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onDelete={deleteNotification}
              onClearAll={clearAllNotifications}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function ScholarshipPage() {
  return (
    <UserProfileProvider>
      <ScholarshipContent />
    </UserProfileProvider>
  );
}