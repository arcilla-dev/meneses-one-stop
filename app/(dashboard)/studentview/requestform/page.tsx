'use client';

// Example of wiring everything together. Copy what you need into your own page.
import { useState } from 'react';
import RequestFormModal from '@/components/RequestFormModal';
import ConfirmModal from '@/components/ConfirmModal';
import AddSubjectModal from '@/components/AddSubjectModal';
import { requestForms, type RequestFormId, type Subject } from '@/lib/requestForms';

const demoSubjects: Subject[] = [
  { code: 'CPE 402', title: 'Computer Architecture and Organization', units: 3, day: 'Thu', time: '11:00 AM - 8:00 AM' },
  { code: 'CPE 310', title: 'Methods of Research', units: 3, day: 'Thu', time: '11:00 AM - 8:00 AM' },
];

export default function RequestsPageExample() {
  const [formId, setFormId] = useState<RequestFormId | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<{ mode: 'add' | 'remove'; subject: Subject } | null>(null);

  return (
    <>
      {(Object.keys(requestForms) as RequestFormId[]).map((id) => (
        <button key={id} onClick={() => setFormId(id)}>
          {requestForms[id].title}
        </button>
      ))}
      <button onClick={() => setAdding(true)}>Add Subject</button>
      <button onClick={() => setConfirm({ mode: 'remove', subject: demoSubjects[0] })}>Remove Subject</button>

      <RequestFormModal
        open={formId !== null}
        config={requestForms[formId ?? 'report-of-grades']}
        onClose={() => setFormId(null)}
        onSubmit={async (values, config) => {
          // TODO Supabase: await supabase.from('requests').insert({ request_type: config.requestType, details: values })
          console.log(config.requestType, values);
        }}
      />

      <AddSubjectModal
        open={adding}
        subjects={demoSubjects}
        onClose={() => setAdding(false)}
        onPick={(subject) => {
          setAdding(false);
          setConfirm({ mode: 'add', subject });
        }}
      />

      <ConfirmModal
        open={confirm !== null}
        mode={confirm?.mode ?? 'add'}
        subject={confirm?.subject ?? null}
        onClose={() => setConfirm(null)}
        onConfirm={async (reason) => {
          // TODO Supabase: insert { kind: confirm.mode, subject_code, reason }
          console.log(confirm?.mode, confirm?.subject.code, reason);
        }}
      />
    </>
  );
}