'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

import AddSubjectModal from '@/components/student/registrar-comp/AddSubjectModal';
import ConfirmModal from '@/components/student/registrar-comp/ConfirmModal';
import NotificationsTab from '@/components/student/registrar-comp/NotificationsTab';
import OverviewTab from '@/components/student/registrar-comp/OverviewTab';
import RegistrarHeader, { type RegistrarTab } from '@/components/student/registrar-comp/RegistrarHeader';
import RequestFormModal from '@/components/student/registrar-comp/RequestFormModal';
import RequestsTab from '@/components/student/registrar-comp/RequestsTab';
import SubjectsTab from '@/components/student/registrar-comp/SubjectsTab';
import * as api from '@/lib/registrarApi';
import type { NotificationData, SubjectChange } from '@/lib/registrarData';
import type { FormValues, RequestFormConfig, Subject, SubjectChangeKind } from '@/lib/requestForms';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function StudentRegistrarTabs() {
  const [activeTab, setActiveTab] = useState<RegistrarTab>('Overview');

  // data now comes from Supabase
  const [currentSubjects, setCurrentSubjects] = useState<Subject[]>([]);
  const [catalogSubjects, setCatalogSubjects] = useState<Subject[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [subjectChanges, setSubjectChanges] = useState<SubjectChange[]>([]);
  const [loadError, setLoadError] = useState('');

  // modal state
  const [activeForm, setActiveForm] = useState<RequestFormConfig | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [change, setChange] = useState<{ mode: SubjectChangeKind; subject: Subject } | null>(null);

  /* ---------------- load everything from Supabase ---------------- */

  const loadAll = useCallback(async () => {
    try {
      const [current, available, notifs, pending] = await Promise.all([
        api.fetchCurrentSubjects(),
        api.fetchAvailableSubjects(),
        api.fetchNotifications(),
        api.fetchPendingSubjectChanges(),
      ]);

      setCurrentSubjects(current);
      setCatalogSubjects(available);
      setNotifications(
        notifs.map((n) => ({ id: n.id, message: n.message, date: formatDate(n.created_at), isRead: n.is_read })) as NotificationData[],
      );
      setSubjectChanges(
        pending.map((c) => ({
          id: c.id,
          kind: c.kind,
          subjectCode: c.subject_code,
          subjectTitle: c.subject_title,
          reason: c.reason,
          status: 'Pending',
        })) as SubjectChange[],
      );
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your registrar data.');
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ---------------- notifications ---------------- */

  function handleTabChange(tab: RegistrarTab) {
    setActiveTab(tab);
    if (tab === 'Notifications') {
      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
      api.markAllNotificationsRead().catch(console.error);
    }
  }

  function deleteNotification(id: string) {
    setNotifications((list) => list.filter((n) => n.id !== id));
    api.deleteNotification(id).catch(() => loadAll());
  }

  function clearAllNotifications() {
    setNotifications([]);
    api.clearNotifications().catch(() => loadAll());
  }

  /* ---------------- document requests ---------------- */
  // The database trigger creates the "request submitted" notification,
  // and the API blocks duplicate open requests, so no extra client logic is needed.

  async function submitDocumentRequest(values: FormValues, config: RequestFormConfig) {
    await api.submitDocumentRequest(values, config); // throws -> message shows inside the modal
    await loadAll();
  }

  /* ---------------- subject changes ---------------- */

  const pendingAddCodes = subjectChanges.filter((c) => c.kind === 'add').map((c) => c.subjectCode);
  const addableSubjects = catalogSubjects.filter((s) => !pendingAddCodes.includes(s.code));

  async function confirmSubjectChange(reason: string) {
    if (!change) return;
    await api.submitSubjectChange(change.mode, change.subject, reason);
    await loadAll();
  }

  /* ---------------- render ---------------- */

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <RegistrarHeader activeTab={activeTab} onTabChange={handleTabChange} />

        {loadError && (
          <p role="alert" className="mx-auto w-full max-w-5xl rounded-md bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
            {loadError}
          </p>
        )}

        <div className="mx-auto mt-8 min-h-[400px] w-full max-w-5xl px-4">
          {activeTab === 'Overview' && (
            <OverviewTab notifications={notifications} currentSubjects={currentSubjects} onTabChange={handleTabChange} />
          )}

          {activeTab === 'Requests' && <RequestsTab onSelect={setActiveForm} />}

          {activeTab === 'Add/Remove Subjects' && (
            <SubjectsTab
              subjects={currentSubjects}
              pendingChanges={subjectChanges}
              onAdd={() => setAddOpen(true)}
              onRemove={(subject) => setChange({ mode: 'remove', subject })}
            />
          )}

          {activeTab === 'Notifications' && (
            <NotificationsTab
              notifications={notifications}
              onDelete={deleteNotification}
              onClearAll={clearAllNotifications}
            />
          )}
        </div>
      </div>

      {activeForm && (
        <RequestFormModal open config={activeForm} onClose={() => setActiveForm(null)} onSubmit={submitDocumentRequest} />
      )}

      <AddSubjectModal
        open={addOpen}
        subjects={addableSubjects}
        onClose={() => setAddOpen(false)}
        onPick={(subject) => {
          setAddOpen(false);
          setChange({ mode: 'add', subject });
        }}
      />

      <ConfirmModal
        open={change !== null}
        mode={change?.mode ?? 'add'}
        subject={change?.subject ?? null}
        onClose={() => setChange(null)}
        onConfirm={confirmSubjectChange}
      />
    </main>
  );
}

export default function StudentRegistrar() {
  return (
    <UserProfileProvider>
      <StudentRegistrarTabs />
    </UserProfileProvider>
  );
}