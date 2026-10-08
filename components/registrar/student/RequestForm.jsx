"use client";

import { useState } from "react";
import { registrarDisplayFont } from "./fonts";
import { CLAIM_REQUIREMENTS } from "./data";

const purposes = ["Employment", "Scholarship", "Transfer", "Personal", "Other"];

function getLocalDateValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function RequestForm({ document, pendingRequests, onBack, onSubmit }) {
  const [purpose, setPurpose] = useState("");
  const [copies, setCopies] = useState("1");
  const [copyTypeId, setCopyTypeId] = useState("regular");
  const [claimDate, setClaimDate] = useState("");
  const [notes, setNotes] = useState("");
  const [specifiedDocument, setSpecifiedDocument] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const today = getLocalDateValue();
  const selectedCopyOption = document.copyOptions?.find((option) => option.id === copyTypeId) ?? null;
  const duplicateRequest = pendingRequests.some(
    (request) =>
      request.documentId === document.id &&
      request.copyTypeId === (selectedCopyOption?.id ?? null) &&
      request.status !== "Ready for claiming",
  );
  const copyCount = Number(copies);
  const claimingReminder = CLAIM_REQUIREMENTS.replace(/^Present your /, "bring your ").replace(/\.$/, "");

  function submitRequest(event) {
    event.preventDefault();
    if (isSubmitting || submitted || duplicateRequest) return;

    const nextErrors = {};
    if (!purpose) nextErrors.purpose = "Select a purpose for the request.";
    if (!Number.isInteger(copyCount) || copyCount < 1 || copyCount > 5) {
      nextErrors.copies = "Enter a number of copies from 1 to 5.";
    }
    if (!claimDate) {
      nextErrors.claimDate = "Select a preferred claim date.";
    } else if (claimDate < today) {
      nextErrors.claimDate = "The claim date cannot be in the past.";
    }
    if (document.id === "other" && !specifiedDocument.trim()) {
      nextErrors.specifiedDocument = "Specify the document you are requesting.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const created = onSubmit({
      document,
      copyOption: selectedCopyOption,
      purpose,
      copies: copyCount,
      claimDate,
      notes: notes.trim(),
      specifiedDocument: specifiedDocument.trim(),
    });
    if (!created) {
      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);
    window.setTimeout(onBack, 1200);
  }

  const fieldClass =
    "w-full rounded-md border border-[#a27d9a] bg-[#f4d2e6] px-3 py-2 text-[#45324f] outline-none focus:ring-2 focus:ring-[#87577d]";

  return (
    <section className="w-full rounded-md border border-[#956887] bg-gradient-to-br from-[#bd91ad] to-[#a47a9d] p-4 shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-md px-3 py-1.5 text-sm font-semibold text-[#493352] transition-colors hover:bg-[#f4d2e6]"
      >
        ← Back
      </button>
      <h2 className={`${registrarDisplayFont.className} text-center text-xl leading-tight text-[#48305d]`}>
        {document.title}
      </h2>
      <p className="mt-1 text-center text-sm text-[#493352]">{document.description}</p>

      <div className="mt-4 rounded-md border border-[#a96f98] bg-[#f4d2e6] p-3 text-sm text-[#493352]">
        <p><span className="font-semibold">Requirements:</span> {document.requirements}</p>
        {!document.copyOptions && (
          <p className="mt-1"><span className="font-semibold">{document.feeNote}</span></p>
        )}
        <p className="mt-1"><span className="font-semibold">Processing time:</span> {document.processingTime}</p>
        <p className="mt-1">
          <span className="font-semibold">When claiming:</span> {CLAIM_REQUIREMENTS}{" "}
          {selectedCopyOption?.fee
            ? "Payment is made at the Cashier when you claim your copy."
            : document.copyOptions
              ? "No payment is required for a regular copy."
              : "Payment, if applicable, is made at the Cashier when you claim your copy."}
        </p>
        {selectedCopyOption?.fee > 0 && (
          <p className="mt-1">
            <span className="font-semibold">
              Fee: ₱{selectedCopyOption.fee} per copy, payable at the Cashier.
            </span>
          </p>
        )}
      </div>

      {duplicateRequest && (
        <p role="alert" className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
          You already have a pending request for this document.
        </p>
      )}
      {submitted && (
        <p role="status" className="mt-4 rounded-md bg-green-100 px-3 py-2 text-sm font-semibold text-green-800">
          Your request has been submitted. Please {claimingReminder} when claiming.
        </p>
      )}

      <form noValidate onSubmit={submitRequest} className="mt-4 space-y-4">
        {document.id === "other" && (
          <div>
            <label htmlFor="specify-document" className="mb-1 block text-sm font-semibold text-[#493352]">
              Specify Document
            </label>
            <input
              id="specify-document"
              value={specifiedDocument}
              onChange={(event) => setSpecifiedDocument(event.target.value)}
              className={fieldClass}
              required
            />
            {errors.specifiedDocument && <p className="mt-1 text-sm text-red-700">{errors.specifiedDocument}</p>}
          </div>
        )}

        {document.copyOptions && (
          <div>
            <label htmlFor="request-copy-type" className="mb-1 block text-sm font-semibold text-[#493352]">
              Type of Copy
            </label>
            <select
              id="request-copy-type"
              value={copyTypeId}
              onChange={(event) => setCopyTypeId(event.target.value)}
              className={fieldClass}
            >
              {document.copyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} — {option.fee === 0 ? "Free" : `₱${option.fee} per copy`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="request-purpose" className="mb-1 block text-sm font-semibold text-[#493352]">
            Purpose of Request
          </label>
          <select
            id="request-purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            className={fieldClass}
            required
          >
            <option value="">Select a purpose</option>
            {purposes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          {errors.purpose && <p className="mt-1 text-sm text-red-700">{errors.purpose}</p>}
        </div>

        <div>
          <label htmlFor="request-copies" className="mb-1 block text-sm font-semibold text-[#493352]">
            Number of Copies
          </label>
          <input
            id="request-copies"
            type="number"
            min="1"
            max="5"
            step="1"
            value={copies}
            onChange={(event) => setCopies(event.target.value)}
            className={fieldClass}
            required
          />
          {errors.copies && <p className="mt-1 text-sm text-red-700">{errors.copies}</p>}
          {selectedCopyOption && Number.isInteger(copyCount) && copyCount >= 1 && copyCount <= 5 && (
            <p className="mt-1 text-sm font-semibold text-[#493352]">
              Estimated fee to pay at the Cashier:{" "}
              {selectedCopyOption.fee === 0
                ? "Free"
                : formatCurrency(selectedCopyOption.fee * copyCount)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="claim-date" className="mb-1 block text-sm font-semibold text-[#493352]">
            Preferred Claim Date
          </label>
          <input
            id="claim-date"
            type="date"
            min={today}
            value={claimDate}
            onChange={(event) => setClaimDate(event.target.value)}
            className={fieldClass}
            required
          />
          {errors.claimDate && <p className="mt-1 text-sm text-red-700">{errors.claimDate}</p>}
        </div>

        <div>
          <label htmlFor="request-notes" className="mb-1 block text-sm font-semibold text-[#493352]">
            Additional Notes <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id="request-notes"
            rows="3"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={fieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || submitted || duplicateRequest}
          className="w-full rounded-lg bg-[#87577d] py-3 text-base font-bold text-white transition-colors hover:bg-[#71476b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
        </button>
      </form>
    </section>
  );
}
