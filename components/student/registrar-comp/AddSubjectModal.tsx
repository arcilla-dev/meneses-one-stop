'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import type { Subject } from '../../../lib/requestForms';

interface Props {
  open: boolean;
  subjects: Subject[]; // later: fetch from your Supabase `subjects` table
  onClose: () => void;
  /** Close this modal and open <ConfirmModal mode="add" /> in the parent */
  onPick: (subject: Subject) => void;
}

export default function AddSubjectModal({ open, subjects, onClose, onPick }: Props) {
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? subjects.filter((s) => `${s.code} ${s.title}`.toLowerCase().includes(q)) : subjects;
  }, [query, subjects]);

  return (
    <Modal open={open} title="Add Subject" onClose={onClose}>
      <div className="rm-field">
        <label className="rm-label" htmlFor="rm-subject-search">
          Search Subject
        </label>
        <input
          id="rm-subject-search"
          className="rm-input"
          type="search"
          value={query}
          placeholder="Enter course code or name, ex. CPE"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="rm-label">Available Subjects</p>
      <ul className="rm-subject-list">
        {results.length === 0 && <li className="rm-empty">No subjects match “{query}”. Try a course code like CPE.</li>}
        {results.map((s) => (
          <li key={s.code} className="rm-subject-row">
            <div>
              <strong>
                {s.code} <span>{s.title}</span>
              </strong>
              <small>
                {s.units} {s.units === 1 ? 'Unit' : 'Units'} • {s.day} • {s.time}
              </small>
            </div>
            <button type="button" className="rm-btn rm-btn--solid rm-btn--sm" onClick={() => onPick(s)}>
              + Add subject
            </button>
          </li>
        ))}
      </ul>

      <div className="rm-actions">
        <button type="button" className="rm-btn rm-btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}