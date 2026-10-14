'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { registrarDisplayFont } from '../../../lib/scholarshipFonts';
import type { Application, ApplicationDraft, Scholarship } from '../../../lib/scholarshipData';
import { formatPhone } from '../../../lib/scholarshipUtils';
import FileUploadField from './FileUploadField';

const inputClassName =
  'mt-1 w-full rounded-md border border-[#c99fbd] bg-white/70 px-3 py-2 text-sm text-[#392641] outline-none focus:border-[#87577d] focus:ring-2 focus:ring-[#87577d]/30';

const infoFields = [
  ['Student Name', 'full_name'],
  ['Student Number', 'student_number'],
  ['Year & Section', 'year_section'],
] as const;

interface Props {
  scholarship: Scholarship;
  onCancel: () => void;
  /** Async: throw an Error to show its message in this form. */
  onSubmit: (draft: ApplicationDraft) => Promise<Application>;
  onSubmitted: (application: Application) => void;
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1 text-xs text-red-700">
      {children}
    </p>
  );
}

export default function ApplicationForm({ scholarship, onCancel, onSubmit, onSubmitted }: Props) {
  const { studentProfile, loading } = useUserProfile();
  const profile = studentProfile as Record<string, unknown> | null;
  const profileEmail = typeof profile?.email === 'string' ? profile.email : '';
  const profilePhone = formatPhone(typeof profile?.phone === 'string' ? profile.phone : '');

  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const [phoneOverride, setPhoneOverride] = useState<string | null>(null);
  const [gpa, setGpa] = useState('');
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const email = emailOverride ?? profileEmail;
  const phone = phoneOverride ?? profilePhone;

  function setFieldError(field: string, message: string) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function handleFileChange(documentName: string, file: File | null, message: string) {
    setFiles((current) => ({ ...current, [documentName]: file ?? undefined }));
    setFileErrors((current) => ({ ...current, [documentName]: message }));
    setErrors((current) => ({
      ...current,
      [`document-${documentName}`]: file ? '' : message,
    }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (scholarship.requiresGpa) {
      if (!gpa) {
        next.gpa = 'Current GPA is required.';
      } else {
        const value = Number(gpa);
        if (!Number.isFinite(value) || value < 1 || value > 5 || !/^\d+(\.\d{1,2})?$/.test(gpa)) {
          next.gpa = 'Enter a GPA from 1.00 to 5.00 with up to 2 decimals.';
        } else if (scholarship.maxGpa && value > scholarship.maxGpa) {
          next.gpa = `Your GPA does not meet the requirement (${scholarship.maxGpa.toFixed(2)} or better).`;
        }
      }
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) next.email = 'Enter a valid email address.';

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) next.phone = 'Contact number is required.';
    else if (!/^09\d{2}-\d{3}-\d{4}$/.test(trimmedPhone)) next.phone = 'Use the format 09XX-XXX-XXXX.';

    scholarship.requiredDocuments.forEach((name) => {
      if (fileErrors[name]) next[`document-${name}`] = fileErrors[name];
      else if (!files[name]) next[`document-${name}`] = 'This document is required.';
    });

    if (!confirmed) next.confirmation = 'Please confirm your information to continue.';

    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      requestAnimationFrame(() => {
        fieldRefs.current[firstInvalid]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setSubmissionError('');
    try {
      const uploads: Record<string, File> = {};
      scholarship.requiredDocuments.forEach((name) => {
        const file = files[name];
        if (file) uploads[name] = file;
      });
      const application = await onSubmit({
        scholarship,
        contact: { email: email.trim(), phone: phone.trim() },
        ...(scholarship.requiresGpa ? { gpa: Number(gpa).toFixed(2) } : {}),
        files: uploads,
      });
      onSubmitted(application);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    const hasUnsavedInput =
      (emailOverride !== null && emailOverride !== profileEmail) ||
      (phoneOverride !== null && phoneOverride !== profilePhone) ||
      gpa !== '' ||
      Object.values(files).some(Boolean) ||
      confirmed;
    if (hasUnsavedInput && !window.confirm('Discard this application?')) return;
    onCancel();
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2 className={`${registrarDisplayFont.className} mb-6 text-center text-2xl leading-tight text-[#48305d]`}>
        {scholarship.name} Application
      </h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {submissionError && (
          <p role="alert" className="text-sm text-red-700">
            {submissionError}
          </p>
        )}

        <section>
          <h3 className="mb-3 font-bold text-[#48305d]">Student Information</h3>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-3" aria-label="Loading student information">
              {[1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#d8afcc]" />
                  <div className="h-9 animate-pulse rounded bg-[#e8c3da]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {infoFields.map(([label, key]) => {
                const value = profile?.[key];
                return (
                  <label key={key} className="block text-xs font-semibold">
                    {label}
                    <input
                      readOnly
                      value={value == null || value === '' ? '—' : String(value)}
                      className={`${inputClassName} bg-[#e8c3da]`}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {scholarship.requiresGpa && (
          <div ref={(element) => { fieldRefs.current.gpa = element; }}>
            <label htmlFor="application-gpa" className="text-sm font-semibold">
              Current GPA <span className="text-red-700">*</span>
            </label>
            <input
              id="application-gpa"
              type="number"
              min="1.00"
              max="5.00"
              step="0.01"
              value={gpa}
              onChange={(event) => {
                setGpa(event.target.value);
                setFieldError('gpa', '');
              }}
              className={inputClassName}
              aria-invalid={Boolean(errors.gpa)}
              aria-describedby={errors.gpa ? 'application-gpa-error' : undefined}
            />
            {errors.gpa && <ErrorText id="application-gpa-error">{errors.gpa}</ErrorText>}
          </div>
        )}

        <section>
          <h3 className="mb-3 font-bold text-[#48305d]">Contact Information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div ref={(element) => { fieldRefs.current.email = element; }}>
              <label htmlFor="application-email" className="text-sm font-semibold">
                Email Address <span className="text-red-700">*</span>
              </label>
              <input
                id="application-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmailOverride(event.target.value);
                  setFieldError('email', '');
                }}
                className={inputClassName}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'application-email-error' : undefined}
              />
              {errors.email && <ErrorText id="application-email-error">{errors.email}</ErrorText>}
            </div>
            <div ref={(element) => { fieldRefs.current.phone = element; }}>
              <label htmlFor="application-phone" className="text-sm font-semibold">
                Contact Number <span className="text-red-700">*</span>
              </label>
              <input
                id="application-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                placeholder="09XX-XXX-XXXX"
                onChange={(event) => {
                  setPhoneOverride(formatPhone(event.target.value));
                  setFieldError('phone', '');
                }}
                className={inputClassName}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'application-phone-error' : undefined}
              />
              {errors.phone && <ErrorText id="application-phone-error">{errors.phone}</ErrorText>}
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-bold text-[#48305d]">Required Documents</h3>
          <div className="space-y-4">
            {scholarship.requiredDocuments.map((documentName, index) => {
              const errorKey = `document-${documentName}`;
              return (
                <FileUploadField
                  key={documentName}
                  id={`document-${scholarship.id}-${index}`}
                  label={documentName}
                  file={files[documentName]}
                  error={errors[errorKey] || fileErrors[documentName]}
                  fieldRef={(element) => { fieldRefs.current[errorKey] = element; }}
                  onFileChange={(file, message) => handleFileChange(documentName, file, message)}
                  onRemove={() => handleFileChange(documentName, null, '')}
                />
              );
            })}
          </div>
          {/* TODO (Supabase): the page uploads these Files to a private Storage bucket (own files only via RLS). */}
        </section>

        <div ref={(element) => { fieldRefs.current.confirmation = element; }} className="space-y-1">
          <label className="flex items-start gap-2 text-sm text-[#392641]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => {
                setConfirmed(event.target.checked);
                setFieldError('confirmation', '');
              }}
              className="mt-0.5 accent-[#87577d]"
            />
            <span>
              I confirm that the information I provided is correct.
              <span className="text-red-700"> *</span>
            </span>
          </label>
          {errors.confirmation && <ErrorText id="application-confirmation-error">{errors.confirmation}</ErrorText>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#d8afcc] pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md bg-[#e8c3da] px-5 py-2.5 text-sm font-bold text-[#684f6c] transition-colors hover:bg-[#d8a6c7]"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={!confirmed || submitting}
            className="rounded-md bg-[#87577d] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#68466f] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          </button>
        </div>
      </form>
    </section>
  );
}