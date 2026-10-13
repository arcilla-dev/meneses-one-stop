'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

import InfirmaryHeader, { type InfirmaryTab } from '@/components/infirmary-comp/InfirmaryHeader';
import MyAppointmentTab from '@/components/infirmary-comp/AppointmentTab';
import NotificationTab from '@/components/infirmary-comp/NotificationTab';
import OverviewTab from '@/components/infirmary-comp/OverviewTab';
import RequestScheduleTab from '@/components/infirmary-comp/RequestScheduleTab';
import type { Appointment, AppointmentDraft, AppointmentStatus, InfirmaryNotification } from '@/lib/infirmaryData';
import * as api from '@/lib/infirmaryApi';

function StudentInfirmaryContent() {
  const [activeTab, setActiveTab] = useState<InfirmaryTab>('Overview');
  const [notifications, setNotifications] = useState<InfirmaryNotification[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadError, setLoadError] = useState('');

  /* ---------------- load from Supabase ---------------- */

  const loadAll = useCallback(async () => {
    try {
      const [appts, notifs] = await Promise.all([api.fetchAppointments(), api.fetchNotifications()]);
      setAppointments(appts);
      setNotifications(notifs);
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your infirmary data.');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ---------------- notifications ---------------- */
  // New notifications are created by a database trigger when an appointment is
  // submitted or its status changes, so the page never inserts them itself.

  function markNotificationRead(id: string) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.markNotificationRead(id).catch(() => loadAll());
  }

  function deleteNotification(id: string) {
    setNotifications((list) => list.filter((n) => n.id !== id));
    api.deleteNotification(id).catch(() => loadAll());
  }

  function clearAllNotifications() {
    setNotifications([]);
    api.clearNotifications().catch(() => loadAll());
  }

  /* ---------------- appointments ---------------- */

  async function submitAppointment(draft: AppointmentDraft) {
    await api.submitAppointment(draft); // throws -> message shows inside the form
    await loadAll();
  }

  async function cancelAppointment(id: string) {
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment || !['Pending', 'Approved'].includes(appointment.status)) return;

    try {
      await api.cancelAppointment(id);
      await loadAll();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not cancel the appointment.');
    }
  }

  /** Dev-only buttons. Students can't change status; the clinic does it in Supabase (or an admin screen). */
  function changeAppointmentStatus(id: string, status: AppointmentStatus) {
    console.info(
      `Approve/Reject is done on the clinic side. In Supabase run: update appointments set status = '${status.toLowerCase()}' where id = '${id}';`,
    );
  }

  /* ---------------- render ---------------- */

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <InfirmaryHeader activeTab={activeTab} onTabChange={setActiveTab} />

        {loadError && (
          <p role="alert" className="mx-auto w-full max-w-5xl rounded-md bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
            {loadError}
          </p>
        )}

        <div className="mx-auto mt-8 min-h-[400px] w-full max-w-5xl px-4">
          {activeTab === 'Overview' && (
            <OverviewTab appointments={appointments} notifications={notifications} onNavigate={setActiveTab} />
          )}
          {activeTab === 'Request Schedule' && (
            <RequestScheduleTab appointments={appointments} onSubmit={submitAppointment} onNavigate={setActiveTab} />
          )}
          {activeTab === 'My Appointments' && (
            <MyAppointmentTab
              appointments={appointments}
              onCancelAppointment={cancelAppointment}
              onChangeAppointmentStatus={changeAppointmentStatus}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'Notifications' && (
            <NotificationTab
              notifications={notifications}
              onDelete={deleteNotification}
              onMarkRead={markNotificationRead}
              onClearAll={clearAllNotifications}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function StudentInfirmary() {
  return (
    <UserProfileProvider>
      <StudentInfirmaryContent />
    </UserProfileProvider>
  );
}