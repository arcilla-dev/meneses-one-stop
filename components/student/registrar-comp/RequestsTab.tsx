'use client';

import { ChevronRight, FileText } from 'lucide-react';
import { registrarDisplayFont } from '../../../lib/registrarFonts';
import { CLAIM_REQUIREMENTS, requestCards } from '../../../lib/registrarData';
import { requestForms, type RequestFormConfig } from '../../../lib/requestForms';

interface Props {
  /** Parent opens <RequestFormModal /> for the chosen config */
  onSelect: (config: RequestFormConfig) => void;
}

export default function RequestsTab({ onSelect }: Props) {
  return (
    <section className="w-full rounded-md border border-[#956887] bg-gradient-to-br from-[#bd91ad] to-[#a47a9d] p-3 shadow-sm">
      <h2 className={`${registrarDisplayFont.className} mb-2 text-center text-[17px] leading-tight text-[#48305d]`}>
        Document Requests
      </h2>
      <ul className="space-y-1.5">
        {Object.values(requestForms).map((config) => {
          const card = requestCards[config.id];
          return (
            <li key={config.id}>
              <button
                type="button"
                onClick={() => onSelect(config)}
                className="flex w-full items-center gap-3 rounded-md border border-[#a96f98] bg-[#f4d2e6] px-5 py-4 text-left text-[#493352] transition-colors hover:bg-[#f8deed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#754c70]"
              >
                <FileText className="h-6 w-6 shrink-0 text-[#b878a2]" strokeWidth={1.7} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-bold">{config.title}</span>
                  <span className="block truncate text-base leading-tight">{card.description}</span>
                </span>
                <span className="shrink-0 text-right text-xs leading-tight text-[#684f6c]">{card.processingTime}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#64435f]" strokeWidth={3} />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-center text-xs text-[#493352]">When claiming: {CLAIM_REQUIREMENTS}</p>
    </section>
  );
}