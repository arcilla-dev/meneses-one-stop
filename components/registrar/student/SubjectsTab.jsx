"use client";

import { useMemo, useState } from "react";
import { registrarDisplayFont } from "./fonts";
import { availableSubjects as subjectSuggestions } from "./data";

export default function SubjectsTab({ subjects, pendingRequests, onRequestSubject }) {
  const [mode, setMode] = useState("add");
  const [query, setQuery] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const pendingSubjectIds = useMemo(
    () => new Set(pendingRequests.map((request) => `${request.type}:${request.subjectId}`)),
    [pendingRequests],
  );
  const candidates =
    mode === "add"
      ? subjectSuggestions.filter(
          (subject) =>
            !subjects.some((currentSubject) => currentSubject.id === subject.id) &&
            !pendingSubjectIds.has(`add:${subject.id}`),
        )
      : subjects.filter((subject) => !pendingSubjectIds.has(`drop:${subject.id}`));
  const normalizedQuery = query.toLowerCase().replace(/\s/g, "");
  const matchingSubjects = normalizedQuery
    ? candidates.filter((subject) =>
        `${subject.code}${subject.name}`
          .toLowerCase()
          .replace(/\s/g, "")
          .includes(normalizedQuery),
      )
    : candidates;
  const suggestions = matchingSubjects.slice(0, 5);
  const showSuggestions = isInputFocused && !selectedSubject;

  function selectSubject(subject) {
    setSelectedSubject(subject);
    setQuery(`${subject.code} ${subject.name}`);
    setIsInputFocused(false);
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setQuery("");
    setSelectedSubject(null);
  }

  function submitRequest(event) {
    event.preventDefault();
    if (!selectedSubject) return;

    onRequestSubject(mode, selectedSubject);
    setQuery("");
    setSelectedSubject(null);
    setIsInputFocused(false);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="w-full rounded-md border border-[#775b83] bg-gradient-to-br from-[#a58baa] to-[#715578] p-3 shadow-md">
        <h2 className={`${registrarDisplayFont.className} mb-3 text-[19px] leading-tight text-white sm:text-[21px]`}>
          Request a Subject Change
        </h2>

        <div className="mb-3 flex gap-2">
          {[
            { value: "add", label: "ADD" },
            { value: "drop", label: "REMOVE" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => changeMode(option.value)}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                mode === option.value
                  ? "bg-[#87577d] text-white"
                  : "bg-[#d8afcc] text-[#45324f] hover:bg-[#e2bed7]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={submitRequest}>
          <div className="relative">
            <label htmlFor="subject-search" className="sr-only">
              Search subjects to {mode === "add" ? "add" : "remove"}
            </label>
            <input
              id="subject-search"
              type="text"
              value={query}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedSubject(null);
              }}
              placeholder={`Search ${mode === "add" ? "available" : "current"} subjects`}
              autoComplete="off"
              className="w-full rounded-md border border-[#a27d9a] bg-[#f4d2e6] px-4 py-3 text-base text-[#45324f] outline-none placeholder:text-[#785575] focus:ring-2 focus:ring-[#87577d]"
            />
            {showSuggestions && (
              <ul
                role="listbox"
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-[#a27d9a] bg-[#f4d2e6] shadow-lg"
              >
                {suggestions.length > 0 ? (
                  suggestions.map((subject) => (
                    <li key={subject.id} role="option" aria-selected="false">
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSubject(subject)}
                        className="flex w-full items-center justify-between gap-4 border-b border-[#c7a2bb] px-4 py-3 text-left text-[#45324f] transition-colors last:border-b-0 hover:bg-[#e8c3da]"
                      >
                        <span className="min-w-0">
                          <span className="mr-2 font-bold">{subject.code}</span>
                          <span>{subject.name}</span>
                        </span>
                        <span className="shrink-0 text-sm">{subject.units} units</span>
                      </button>
                    </li>
                  ))
                ) : normalizedQuery ? (
                  <li className="px-4 py-3 text-sm text-[#45324f]">
                    No subjects found for &quot;{query}&quot;.
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          {selectedSubject && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#87577d] px-3 py-1 text-sm font-semibold text-white">
                <strong className="mr-1">{selectedSubject.code}</strong>
                {selectedSubject.name}
                <span className="ml-2">· {selectedSubject.units} units</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubject(null);
                  setQuery("");
                  setIsInputFocused(true);
                }}
                aria-label="Clear selected subject"
                className="rounded px-2 py-1 text-sm font-semibold text-[#45324f] hover:bg-[#d8afcc]"
              >
                Clear
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedSubject}
            className="mt-3 w-full rounded-lg bg-[#87577d] py-3 text-lg font-bold text-white transition-colors hover:bg-[#71476b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            REQUEST
          </button>
        </form>
      </section>

      <section className="w-full rounded-md border border-[#775b83] bg-gradient-to-br from-[#a58baa] to-[#715578] p-3 shadow-md">
        <h2 className={`${registrarDisplayFont.className} mb-1.5 text-[19px] leading-tight text-white sm:text-[21px]`}>
          Current Subjects
        </h2>
        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6b5a80]">
          <table className="table-fixed w-full border-collapse bg-[#d8afcc] text-base text-[#45324f]">
            <colgroup>
              <col className="w-40" />
              <col />
              <col className="w-28" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-[#d5a9c9] text-[#201726]">
              <tr>
                <th scope="col" className="whitespace-nowrap border border-[#a27d9a] px-4 py-3 text-left align-middle text-lg font-semibold">
                  Course Code
                </th>
                <th scope="col" className="border border-[#a27d9a] px-4 py-3 text-left align-middle text-lg font-semibold">
                  Course Name
                </th>
                <th scope="col" className="border border-[#a27d9a] px-4 py-3 text-center align-middle text-lg font-semibold">
                  Units
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-[#e2bed7]">
                  <td className="border border-[#a27d9a] px-4 py-3 text-left align-middle">{subject.code}</td>
                  <td className="border border-[#a27d9a] px-4 py-3 align-middle">
                    <span>{subject.name}</span>
                    {pendingRequests.some(
                      (request) => request.type === "drop" && request.subjectId === subject.id,
                    ) && (
                      <span className="ml-2 inline-flex rounded-full bg-[#87577d] px-2 py-0.5 text-xs font-semibold text-white">
                        Drop pending
                      </span>
                    )}
                  </td>
                  <td className="border border-[#a27d9a] px-4 py-3 text-center align-middle">{subject.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
