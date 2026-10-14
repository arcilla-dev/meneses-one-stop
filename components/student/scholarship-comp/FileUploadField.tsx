'use client';

import { useRef, type ChangeEvent } from 'react';
import { X } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);

interface Props {
  id: string;
  label: string;
  file?: File;
  error?: string;
  onFileChange: (file: File | null, message: string) => void;
  onRemove: () => void;
  fieldRef?: (element: HTMLDivElement | null) => void;
}

export default function FileUploadField({ id, label, file, error, onFileChange, onRemove, fieldRef }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (!allowedExtensions.test(selected.name) || !(selected.type === '' || allowedTypes.has(selected.type))) {
      onFileChange(null, 'Choose a PDF, JPG, or PNG file.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      onFileChange(null, 'File size must be 5 MB or less.');
      return;
    }
    onFileChange(selected, '');
  }

  return (
    <div ref={fieldRef} className="space-y-1">
      <span className="block text-sm font-semibold text-[#392641]">{label}</span>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={handleChange}
        className="sr-only"
        aria-label={`Upload ${label}`}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-[#d8a6c7] px-3 py-2 text-xs font-bold text-[#48305d] transition-colors hover:bg-[#c58bb1] hover:text-white"
        >
          Choose File
        </button>
        {file ? (
          <>
            <span className="max-w-full truncate text-xs text-[#684f6c]">{file.name}</span>
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={onRemove}
              className="rounded-full p-1 text-[#765f7a] transition hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <span className="text-xs text-[#8f7890]">No file chosen</span>
        )}
      </div>
      {error && <p id={`${id}-error`} className="text-xs text-red-700">{error}</p>}
    </div>
  );
}