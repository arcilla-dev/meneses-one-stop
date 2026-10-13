'use client';

import { registrarDisplayFont } from '../../lib/registrarFonts';
import type { SubjectChange } from '../../lib/registrarData';
import type { Subject } from '../../lib/requestForms';

interface Props {
  subjects: Subject[];
  pendingChanges: SubjectChange[];
  /** Parent opens <AddSubjectModal /> */
  onAdd: () => void;
  /** Parent opens <ConfirmModal mode="remove" /> */
  onRemove: (subject: Subject) => void;
}

const panel = 'w-full rounded-md border border-[#775b83] bg-gradient-to-br from-[#a58baa] to-[#715578] p-3 shadow-md';
const th = 'border border-[#a27d9a] px-4 py-3 text-left align-middle text-lg font-semibold';
const td = 'border border-[#a27d9a] px-4 py-3 align-middle';

export default function SubjectsTab({ subjects, pendingChanges, onAdd, onRemove }: Props) {
  const isRemovePending = (code: string) =>
    pendingChanges.some((c) => c.kind === 'remove' && c.subjectCode === code);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className={panel}>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <h2 className={`${registrarDisplayFont.className} text-[19px] leading-tight text-white sm:text-[21px]`}>
            Current Subjects
          </h2>
          <button
            type="button"
            onClick={onAdd}
            className="rounded-md bg-[#87577d] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#71476b]"
          >
            + Add subject
          </button>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[640px] border-collapse bg-[#d8afcc] text-base text-[#45324f]">
            <thead className="sticky top-0 z-10 bg-[#d5a9c9] text-[#201726]">
              <tr>
                <th scope="col" className={th}>Course Code</th>
                <th scope="col" className={th}>Course Name</th>
                <th scope="col" className={`${th} text-center`}>Units</th>
                <th scope="col" className={th}>Schedule</th>
                <th scope="col" className={th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.code} className="hover:bg-[#e2bed7]">
                  <td className={td}>{s.code}</td>
                  <td className={td}>{s.title}</td>
                  <td className={`${td} text-center`}>{s.units.toFixed(1)}</td>
                  <td className={`${td} text-sm`}>{s.day} · {s.time}</td>
                  <td className={`${td} text-right`}>
                    {isRemovePending(s.code) ? (
                      <span className="inline-flex rounded-full bg-[#87577d] px-2 py-0.5 text-xs font-semibold text-white">
                        Remove pending
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRemove(s)}
                        className="rounded-md bg-[#87577d] px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#71476b]"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pendingChanges.length > 0 && (
        <section className={panel}>
          <h2 className={`${registrarDisplayFont.className} mb-2 text-[19px] leading-tight text-white sm:text-[21px]`}>
            Pending Requests
          </h2>
          <ul className="space-y-1.5">
            {pendingChanges.map((c) => (
              <li key={c.id} className="rounded-md bg-[#d8afcc] px-4 py-3 text-sm text-[#45324f]">
                <strong>{c.kind === 'add' ? 'Add' : 'Remove'}</strong> {c.subjectCode} {c.subjectTitle}
                <span className="block text-xs">Reason: {c.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}