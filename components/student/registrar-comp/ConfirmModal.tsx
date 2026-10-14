'use client';

import { useEffect, useId, useState } from 'react';
import Modal from './Modal';
import { subjectReasons, type Subject, type SubjectChangeKind } from '../../../lib/requestForms';

interface Props {
  open: boolean;
  mode: SubjectChangeKind;
  subject: Subject | null;
  onClose: () => void;
  /** Receives the chosen reason (or the typed text when "Other" is picked). Save to Supabase here. */
  onConfirm: (reason: string) => Promise<void> | void;
}

const OTHER = '__other__';

const copy = {
  add: { title: 'Add Subject', question: 'Are you sure you want to add this subject?', heading: 'Reason for Adding?', confirm: 'Confirm Add' },
  remove: { title: 'Remove Subject', question: 'Are you sure you want to remove this subject?', heading: 'Reason for Removal?', confirm: 'Confirm Remove' },
} as const;

export default function ConfirmModal({ open, mode, subject, onClose, onConfirm }: Props) {
  const uid = useId();
  const [choice, setChoice] = useState('');
  const [other, setOther] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setChoice('');
      setOther('');
      setError('');
      setSubmitting(false);
    }
  }, [open, mode, subject]);

  if (!subject) return null;
  const t = copy[mode];

  const handleConfirm = async () => {
    const reason = choice === OTHER ? other.trim() : choice;
    if (!reason) {
      setError(choice === OTHER ? 'Please type your reason.' : 'Please select a reason.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={t.title} onClose={onClose} size="sm" locked={submitting}>
      <p className="rm-question">{t.question}</p>

      <div className="rm-subject">
        <strong>
          {subject.code} <span>{subject.title}</span>
        </strong>
        <small>
          {subject.units} {subject.units === 1 ? 'Unit' : 'Units'} • {subject.day} • {subject.time}
        </small>
      </div>

      <fieldset className="rm-reasons">
        <legend className="rm-label">{t.heading}</legend>

        {subjectReasons[mode].map((r) => (
          <label key={r} className="rm-radio">
            <input type="radio" name={`${uid}-reason`} checked={choice === r} onChange={() => setChoice(r)} />
            <span>{r}</span>
          </label>
        ))}

        <label className="rm-radio">
          <input type="radio" name={`${uid}-reason`} checked={choice === OTHER} onChange={() => setChoice(OTHER)} />
          <span>Other:</span>
        </label>
        <input
          className="rm-input rm-other"
          type="text"
          value={other}
          disabled={choice !== OTHER}
          placeholder="Type your reason"
          aria-label="Other reason"
          onChange={(e) => setOther(e.target.value)}
        />
      </fieldset>

      {error && (
        <p className="rm-error" role="alert">
          {error}
        </p>
      )}

      <div className="rm-actions">
        <button type="button" className="rm-btn rm-btn--ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="rm-btn rm-btn--solid" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Saving…' : t.confirm}
        </button>
      </div>
    </Modal>
  );
}