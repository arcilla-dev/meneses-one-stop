"use client";

import { useRef, useState } from "react";
import { useUserProfile } from "../../../contexts/UserProfileContext";
import { registrarDisplayFont } from "../registrar/fonts";
import FileUploadField from "./FileUploadField";

const inputClassName =
  "mt-1 w-full rounded-md border border-[#c99fbd] bg-white/70 px-3 py-2 text-sm text-[#392641] outline-none focus:border-[#87577d] focus:ring-2 focus:ring-[#87577d]/30";

function formatPhone(value = "") {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

function formatSubmittedDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

function profileValue(studentProfile, key) {
  const value = studentProfile?.[key];
  return value == null || value === "" ? "—" : value;
}

function ErrorText({ id, children }) {
  return (
    <p id={id} className="mt-1 text-xs text-red-700">
      {children}
    </p>
  );
}

export default function ApplicationForm({
  scholarship,
  onCancel,
  onSubmitted,
  onSubmitApplication,
  onAddNotification,
}) {
  const { studentProfile, loading } = useUserProfile();
  const [emailOverride, setEmailOverride] = useState(null);
  const [phoneOverride, setPhoneOverride] = useState(null);
  const [gpa, setGpa] = useState("");
  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fieldRefs = useRef({});
  const email = emailOverride ?? studentProfile?.email ?? "";
  const phone = phoneOverride ?? formatPhone(studentProfile?.phone ?? "");

  function setFieldError(field, message) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function handleFileChange(documentName, file, message) {
    setFiles((current) => ({
      ...current,
      [documentName]: file ?? undefined,
    }));
    setFileErrors((current) => ({ ...current, [documentName]: message }));
    setErrors((current) => ({
      ...current,
      [`document-${documentName}`]: file ? "" : message || "This document is required.",
    }));
  }

  function validate() {
    const nextErrors = {};
    if (scholarship.requiresGpa) {
      if (!gpa) {
        nextErrors.gpa = "Current GPA is required.";
      } else {
        const numericGpa = Number(gpa);
        if (
          !Number.isFinite(numericGpa) ||
          numericGpa < 1 ||
          numericGpa > 5 ||
          !/^\d+(\.\d{1,2})?$/.test(gpa)
        ) {
          nextErrors.gpa = "Enter a GPA from 1.00 to 5.00 with up to 2 decimals.";
        } else if (scholarship.maxGpa && numericGpa > scholarship.maxGpa) {
          nextErrors.gpa = `Your GPA does not meet the requirement (${scholarship.maxGpa.toFixed(2)} or better).`;
        }
      }
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      nextErrors.phone = "Contact number is required.";
    } else if (!/^09\d{2}-\d{3}-\d{4}$/.test(normalizedPhone)) {
      nextErrors.phone = "Use the format 09XX-XXX-XXXX.";
    }

    scholarship.requiredDocuments.forEach((documentName) => {
      if (fileErrors[documentName]) {
        nextErrors[`document-${documentName}`] = fileErrors[documentName];
      } else if (!files[documentName]) {
        nextErrors[`document-${documentName}`] = "This document is required.";
      }
    });

    if (!confirmed) {
      nextErrors.confirmation = "Please confirm your information to continue.";
    }

    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      requestAnimationFrame(() => {
        fieldRefs.current[firstInvalidField]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const now = new Date();
    const application = onSubmitApplication({
      scholarship,
      dateSubmitted: formatSubmittedDate(now),
      documents: scholarship.requiredDocuments.map(
        (documentName) => files[documentName].name,
      ),
      contact: { email: email.trim(), phone: phone.trim() },
      ...(scholarship.requiresGpa ? { gpa: Number(gpa).toFixed(2) } : {}),
    });
    if (application) {
      onAddNotification({
        id: `application-submitted-${application.id}`,
        title: `Application Submitted: ${scholarship.name}`,
        message: "Your application is now pending review.",
        date: formatSubmittedDate(now),
        read: false,
      });
      onSubmitted(application);
    } else {
      setSubmissionError("You already applied for this scholarship.");
    }
    setSubmitting(false);
  }

  function handleCancel() {
    const hasUnsavedInput =
      (emailOverride !== null && emailOverride !== (studentProfile?.email ?? "")) ||
      (phoneOverride !== null &&
        phoneOverride !== formatPhone(studentProfile?.phone ?? "")) ||
      gpa !== "" ||
      Object.values(files).some(Boolean) ||
      confirmed;
    if (hasUnsavedInput && !window.confirm("Discard this application?")) return;
    onCancel();
  }

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2
        className={`${registrarDisplayFont.className} mb-6 text-center text-2xl leading-tight text-[#48305d]`}
      >
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
              {[
                ["Student Name", "full_name"],
                ["Student Number", "student_number"],
                ["Year & Section", "year_section"],
              ].map(([label, key]) => (
                <label key={key} className="block text-xs font-semibold">
                  {label}
                  <input
                    readOnly
                    value={profileValue(studentProfile, key)}
                    className={`${inputClassName} bg-[#e8c3da]`}
                  />
                </label>
              ))}
            </div>
          )}
        </section>

        {scholarship.requiresGpa && (
          <div
            ref={(element) => {
              fieldRefs.current.gpa = element;
            }}
          >
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
                setFieldError("gpa", "");
              }}
              className={inputClassName}
              aria-invalid={Boolean(errors.gpa)}
              aria-describedby={errors.gpa ? "application-gpa-error" : undefined}
            />
            {errors.gpa && (
              <ErrorText id="application-gpa-error">{errors.gpa}</ErrorText>
            )}
          </div>
        )}

        <section>
          <h3 className="mb-3 font-bold text-[#48305d]">Contact Information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              ref={(element) => {
                fieldRefs.current.email = element;
              }}
            >
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
                  setFieldError("email", "");
                }}
                className={inputClassName}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "application-email-error" : undefined}
              />
              {errors.email && (
                <ErrorText id="application-email-error">{errors.email}</ErrorText>
              )}
            </div>
            <div
              ref={(element) => {
                fieldRefs.current.phone = element;
              }}
            >
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
                  setFieldError("phone", "");
                }}
                className={inputClassName}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "application-phone-error" : undefined}
              />
              {errors.phone && (
                <ErrorText id="application-phone-error">{errors.phone}</ErrorText>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-bold text-[#48305d]">Required Documents</h3>
          <div className="space-y-4">
            {scholarship.requiredDocuments.map((documentName) => {
              const errorKey = `document-${documentName}`;
              return (
                <FileUploadField
                  key={documentName}
                  id={`document-${scholarship.id}-${scholarship.requiredDocuments.indexOf(documentName)}`}
                  label={documentName}
                  file={files[documentName]}
                  error={errors[errorKey] || fileErrors[documentName]}
                  fieldRef={(element) => {
                    fieldRefs.current[errorKey] = element;
                  }}
                  onFileChange={(file, message) =>
                    handleFileChange(documentName, file, message)
                  }
                  onRemove={() => handleFileChange(documentName, null, "")}
                />
              );
            })}
          </div>
          {/* TODO: Upload to Supabase Storage in a private bucket with Row Level Security so students can access only their own files. */}
        </section>

        <div
          ref={(element) => {
            fieldRefs.current.confirmation = element;
          }}
          className="space-y-1"
        >
          <label className="flex items-start gap-2 text-sm text-[#392641]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => {
                setConfirmed(event.target.checked);
                setFieldError("confirmation", "");
              }}
              className="mt-0.5 accent-[#87577d]"
            />
            <span>
              I confirm that the information I provided is correct.
              <span className="text-red-700"> *</span>
            </span>
          </label>
          {errors.confirmation && (
            <ErrorText id="application-confirmation-error">
              {errors.confirmation}
            </ErrorText>
          )}
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
            {submitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
          </button>
        </div>
      </form>
    </section>
  );
}
