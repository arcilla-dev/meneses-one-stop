'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import Modal from './Modal';
import type { FieldConfig, FormValues, RequestFormConfig } from '../lib/requestForms';

interface Props {
  open: boolean;
  config: RequestFormConfig;
  onClose: () => void;
  /** Do your Supabase insert here. Throw an Error to show its message inside the modal. */
  onSubmit: (values: FormValues, config: RequestFormConfig) => Promise<void> | void;
}

const emptyValues = (config: RequestFormConfig): FormValues =>
  Object.fromEntries(config.fields.map((f) => [f.name, f.type === 'file' ? null : '']));

export default function RequestFormModal({ open, config, onClose, onSubmit }: Props) {
  const uid = useId();
  const [values, setValues] = useState<FormValues>(() => emptyValues(config));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) {
      setValues(emptyValues(config));
      setErrors({});
      setFormError('');
      setSubmitting(false);
    }
  }, [open, config]);

  const set = (name: string, value: string | File | null) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of config.fields) {
      const v = values[f.name];
      const empty = v === null || v === '' || v === undefined;
      if (f.required !== false && empty) {
        next[f.name] = 'This field is required.';
        continue;
      }
      if (f.type === 'number' && !empty) {
        const n = Number(v);
        if (!Number.isInteger(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max)) {
          next[f.name] = `Enter a whole number from ${f.min ?? 1} to ${f.max ?? 10}.`;
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(values, config);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={config.title} onClose={onClose} locked={submitting}>
      <form onSubmit={handleSubmit} noValidate>
        {config.fields.map((field) => (
          <Field
            key={field.name}
            id={`${uid}-${field.name}`}
            field={field}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(v) => set(field.name, v)}
          />
        ))}

        {formError && (
          <p className="rm-form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="rm-actions">
          <button type="button" className="rm-btn rm-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="rm-btn rm-btn--solid" disabled={submitting}>
            {submitting ? 'Sending…' : config.confirmLabel ?? 'Confirm Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- single field renderer ---------------- */

interface FieldProps {
  id: string;
  field: FieldConfig;
  value: string | File | null;
  error?: string;
  onChange: (v: string | File | null) => void;
}

function Field({ id, field, value, error, onChange }: FieldProps) {
  const text = typeof value === 'string' ? value : '';
  const errId = `${id}-err`;
  const common = { id, 'aria-invalid': !!error, 'aria-describedby': error ? errId : undefined };

  return (
    <div className="rm-field">
      <label className="rm-label" htmlFor={field.type === 'segmented' ? undefined : id} id={`${id}-label`}>
        {field.label}
      </label>

      {field.type === 'select' && (
        <select {...common} className="rm-input rm-select" value={text} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            {field.placeholder ?? 'Select…'}
          </option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'segmented' && (
        <div className="rm-segmented" role="radiogroup" aria-labelledby={`${id}-label`}>
          {field.options?.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={text === o.value}
              className={`rm-seg ${text === o.value ? 'is-active' : ''}`}
              onClick={() => onChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
        <input
          {...common}
          className="rm-input"
          type={field.type}
          value={text}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          inputMode={field.type === 'number' ? 'numeric' : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          {...common}
          className="rm-input rm-textarea"
          rows={3}
          value={text}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'file' && (
        <div className="rm-file">
          <label className="rm-file-btn" htmlFor={id}>
            Choose file
          </label>
          <input
            {...common}
            className="rm-file-input"
            type="file"
            accept={field.accept}
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
          <span className="rm-file-name">{value instanceof File ? value.name : 'No file chosen'}</span>
        </div>
      )}

      {error && (
        <p id={errId} className="rm-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}