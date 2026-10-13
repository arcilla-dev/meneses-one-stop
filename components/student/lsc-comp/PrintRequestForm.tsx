"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  COLOR_OPTIONS,
  LAYOUT_OPTIONS,
  LSC_PAYMENT_NOTE,
  PAPER_SIZES,
  PRINT_LIMITS,
  type ColorId,
  type LayoutId,
  type PaperSizeId,
  type PrintRequest,
  type PrintRequestDraft,
} from "../../../lib/lscData";
import { computeBill, formatPeso } from "../../../lib/lscUtils";

interface PrintRequestFormProps {
  printRequests: PrintRequest[];
  /** Throw an Error(message) to show it in the form. */
  onSubmit: (draft: PrintRequestDraft) => Promise<PrintRequest>;
  onRequestAdded: (requestNumber: string) => void;
}

interface FormErrors {
  pages?: string;
  files?: string;
  duplicate?: string;
  submit?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isAcceptedFile(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return PRINT_LIMITS.acceptedTypes.includes(extension);
}

function sameFileNames(first: string[], second: string[]): boolean {
  if (first.length !== second.length) return false;
  const normalize = (names: string[]) =>
    names.map((n) => n.toLowerCase()).sort((a, b) => a.localeCompare(b));
  const a = normalize(first);
  const b = normalize(second);
  return a.every((name, i) => name === b[i]);
}

export default function PrintRequestForm({
  printRequests,
  onSubmit,
  onRequestAdded,
}: PrintRequestFormProps) {
  const [paperSize, setPaperSize] = useState<PaperSizeId>("letter");
  const [color, setColor] = useState<ColorId>("bw");
  const [layout, setLayout] = useState<LayoutId>("portrait");
  const [pages, setPages] = useState("");
  const [additionalRequest, setAdditionalRequest] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [inputVersion, setInputVersion] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageCount = Number(pages);
  const estimatedBill = computeBill(paperSize, color, pageCount);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    if (selected.some((file) => !isAcceptedFile(file))) {
      setFileError(
        `Unsupported file type. Accepted types: ${PRINT_LIMITS.acceptedTypes.join(", ").toUpperCase()}.`,
      );
      return;
    }

    const maxBytes = PRINT_LIMITS.maxFileSizeMB * 1024 * 1024;
    if (selected.some((file) => file.size > maxBytes)) {
      setFileError(`Each file must be ${PRINT_LIMITS.maxFileSizeMB} MB or less.`);
      return;
    }

    if (files.length + selected.length > PRINT_LIMITS.maxFilesPerRequest) {
      setFileError(
        `You can upload up to ${PRINT_LIMITS.maxFilesPerRequest} files per request.`,
      );
      return;
    }

    setFiles((current) => [...current, ...selected]);
    setFileError("");
    setErrors((current) => ({ ...current, files: undefined }));
  }

  function removeFile(indexToRemove: number) {
    setFiles((current) => current.filter((_, index) => index !== indexToRemove));
    setFileError("");
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!Number.isInteger(pageCount) || pageCount < 1) {
      next.pages = "Enter a whole number of pages greater than 0.";
    } else if (pageCount > PRINT_LIMITS.maxPages) {
      next.pages = `The maximum is ${PRINT_LIMITS.maxPages} pages.`;
    }
    if (files.length === 0) next.files = "Upload at least one file.";

    const fileNames = files.map((file) => file.name);
    const duplicate = printRequests.some(
      (request) =>
        request.status === "Pending" &&
        request.paperSize === paperSize &&
        request.color === color &&
        request.pages === pageCount &&
        sameFileNames(request.fileNames, fileNames),
    );
    if (duplicate) next.duplicate = "An identical print request is already pending.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const request = await onSubmit({
        files,
        paperSize,
        color,
        layout,
        pages: pageCount,
        additionalRequest: additionalRequest.trim(),
      });

      setPaperSize("letter");
      setColor("bw");
      setLayout("portrait");
      setPages("");
      setAdditionalRequest("");
      setFiles([]);
      setFileError("");
      setErrors({});
      setInputVersion((version) => version + 1);
      onRequestAdded(request.requestNumber);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "Something went wrong. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2 className="mb-5 text-2xl font-bold leading-tight text-[#48305d]">
        Request Print Service
      </h2>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Paper Size</legend>
          <div className="grid grid-cols-3 gap-2">
            {PAPER_SIZES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={paperSize === id}
                onClick={() => setPaperSize(id)}
                className={`rounded-md border px-3 py-2 text-sm font-bold transition-colors ${
                  paperSize === id
                    ? "border-[#754c70] bg-[#8c6895] text-white"
                    : "border-[#c58bb1] bg-[#e8c3da] text-[#48305d] hover:bg-[#d8a6c7]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Color</legend>
            <div className="space-y-2">
              {COLOR_OPTIONS.map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="print-color"
                    value={id}
                    checked={color === id}
                    onChange={() => setColor(id)}
                    className="accent-[#754c70]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Layout</legend>
            <div className="space-y-2">
              {LAYOUT_OPTIONS.map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="print-layout"
                    value={id}
                    checked={layout === id}
                    onChange={() => setLayout(id)}
                    className="accent-[#754c70]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <label htmlFor="print-pages" className="mb-1 block text-sm font-semibold">
            No. of Pages <span aria-hidden="true">*</span>
          </label>
          <input
            id="print-pages"
            type="number"
            min={1}
            max={PRINT_LIMITS.maxPages}
            step={1}
            required
            value={pages}
            onChange={(event) => {
              setPages(event.target.value);
              setErrors((current) => ({ ...current, pages: undefined }));
            }}
            aria-invalid={Boolean(errors.pages)}
            aria-describedby={errors.pages ? "print-pages-error" : undefined}
            className="w-full rounded-md border border-[#c58bb1] bg-white px-3 py-2 text-sm text-[#392641] outline-none focus:ring-2 focus:ring-[#8c6895]"
          />
          {errors.pages && (
            <p id="print-pages-error" className="mt-1 text-xs text-red-700">
              {errors.pages}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="print-additional-request" className="mb-1 block text-sm font-semibold">
            Additional Request
          </label>
          <textarea
            id="print-additional-request"
            rows={3}
            maxLength={200}
            value={additionalRequest}
            onChange={(event) => setAdditionalRequest(event.target.value)}
            className="w-full resize-y rounded-md border border-[#c58bb1] bg-white px-3 py-2 text-sm text-[#392641] outline-none focus:ring-2 focus:ring-[#8c6895]"
          />
          <p className="mt-1 text-right text-xs text-[#684f6c]">
            {additionalRequest.length}/200
          </p>
        </div>

        <div>
          <span className="mb-1 block text-sm font-semibold">
            Upload File/s <span aria-hidden="true">*</span>
          </span>
          <input
            key={inputVersion}
            ref={fileInputRef}
            type="file"
            multiple
            accept={PRINT_LIMITS.acceptedTypes.map((type) => `.${type}`).join(",")}
            onChange={handleFilesChange}
            className="sr-only"
            aria-label="Upload print files"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md bg-[#d8a6c7] px-3 py-2 text-xs font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
            >
              Choose File/s
            </button>
            <span className="text-xs text-[#684f6c]">
              Up to {PRINT_LIMITS.maxFilesPerRequest} files,{" "}
              {PRINT_LIMITS.acceptedTypes.join(", ").toUpperCase()},{" "}
              {PRINT_LIMITS.maxFileSizeMB} MB each
            </span>
          </div>
          {files.length > 0 && (
            <ul className="mt-2 space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex min-w-0 items-center gap-2 rounded-md bg-[#e8c3da] px-3 py-2 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-[#684f6c]">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(index)}
                    className="shrink-0 rounded-full p-1 text-[#765f7a] transition hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {(fileError || errors.files) && (
            <p className="mt-1 text-xs text-red-700">{fileError || errors.files}</p>
          )}
          {errors.duplicate && (
            <p className="mt-1 text-xs text-red-700">{errors.duplicate}</p>
          )}
        </div>

        <div className="rounded-md bg-[#e8c3da] p-3">
          <p className="font-bold text-[#48305d]">
            Estimated bill: {formatPeso(estimatedBill)}
          </p>
          <p className="mt-1 text-xs text-[#684f6c]">{LSC_PAYMENT_NOTE}</p>
        </div>

        {errors.submit && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {errors.submit}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[#8c6895] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#754c70] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </section>
  );
}