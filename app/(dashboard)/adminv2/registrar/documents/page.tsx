"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  CATEGORIES,
  ACCEPT_ATTR,
  safeFileName,
  formatDate,
  formatSize,
  validateFile,
  type DocumentItem,
} from "@/lib/documentConfig";

const supabase = createClient();

// Admins only add to these two. "Submitted" belongs to the student.
const ADMIN_CATEGORIES = CATEGORIES.filter((c) => c.key !== "submitted");

interface StudentOption {
  id: string;
  student_number: string;
  full_name: string;
  email: string;
}

export default function AdminDocumentsPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [category, setCategory] = useState<"academic" | "generated">("academic");
  const [docType, setDocType] = useState(ADMIN_CATEGORIES[0].items[0].key);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0); // resets the file input after upload

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // ---- load students (RLS lets staff read profiles + student_profiles) ----
  useEffect(() => {
    (async () => {
      const { data: sp, error: spErr } = await supabase
        .from("student_profiles")
        .select("id, student_number");
      if (spErr || !sp) {
        setError("Could not load students.");
        return;
      }
      const ids = sp.map((s) => s.id);
      const { data: pf } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const byId = new Map((pf ?? []).map((p) => [p.id, p]));

      setStudents(
        sp
          .map((s) => ({
            id: s.id as string,
            student_number: (s.student_number as string) ?? "",
            full_name: byId.get(s.id)?.full_name ?? "(no name)",
            email: byId.get(s.id)?.email ?? "",
          }))
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
      );
    })();
  }, []);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_number.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const loadStudentDocs = async (id: string) => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", id)
      .in("category", ["academic", "generated"])
      .order("created_at", { ascending: false });
    if (error) {
      setError("Could not load this student's documents.");
      return;
    }
    setDocs(data as DocumentItem[]);
  };

  useEffect(() => {
    setDocs([]);
    if (studentId) loadStudentDocs(studentId);
  }, [studentId]);

  const typeOptions = ADMIN_CATEGORIES.find((c) => c.key === category)!.items;

  const handleCategoryChange = (value: "academic" | "generated") => {
    setCategory(value);
    setDocType(ADMIN_CATEGORIES.find((c) => c.key === value)!.items[0].key);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!studentId) return setError("Choose a student first.");
    if (!file) return setError("Choose a file to upload.");
    const problem = validateFile(file);
    if (problem) return setError(problem);

    setBusy(true);
    // The first folder is the STUDENT's id, so the student's own read policy can see it.
    const path = `${studentId}/${category}/${crypto.randomUUID()}-${safeFileName(file.name)}`;

    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
      contentType: file.type,
    });
    if (upErr) {
      setBusy(false);
      return setError(`Upload failed. ${upErr.message}`);
    }

    const { error: dbErr } = await supabase.from("documents").insert({
      user_id: studentId,
      name: file.name,
      category,
      doc_type: docType,
      file_path: path,
      file_size: file.size,
    });
    if (dbErr) {
      await supabase.storage.from("documents").remove([path]);
      setBusy(false);
      return setError(`Could not save the document. ${dbErr.message}`);
    }

    setNotice("File uploaded. The student has been notified.");
    setFile(null);
    setFileKey((k) => k + 1);
    await loadStudentDocs(studentId);
    setBusy(false);
  };

  const handleOpen = async (doc: DocumentItem) => {
    const win = window.open("", "_blank");
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60);
    if (data?.signedUrl && win) win.location.href = data.signedUrl;
    else {
      win?.close();
      setError("Could not open the file.");
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Delete "${doc.name}" for this student?`)) return;
    const { error: dbErr } = await supabase.from("documents").delete().eq("id", doc.id);
    if (dbErr) return setError(`Could not delete. ${dbErr.message}`);
    await supabase.storage.from("documents").remove([doc.file_path]);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const labelFor = (cat: string, type: string) =>
    CATEGORIES.find((c) => c.key === cat)?.items.find((i) => i.key === type)?.label ?? type;

  const field =
    "w-full rounded-lg border border-[#d3bbcc] bg-white px-3 py-2 text-sm text-[#39265f] outline-none focus:border-[#9b51e0]";

  return (
    <div className="min-h-screen bg-[#feeaee] p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-semibold text-[#39265f]" style={{ fontFamily: "Georgia, serif" }}>
          Student Documents
        </h1>
        <p className="mb-6 mt-1 text-sm text-[#5a4a75]">
          Upload Academic and Generated documents for a student. They appear in that student&apos;s My Documents page.
        </p>

        {error && <p className="mb-4 text-sm text-[#671410]">{error}</p>}
        {notice && <p className="mb-4 text-sm text-[#2f6b3a]">{notice}</p>}

        <form
          onSubmit={handleUpload}
          className="grid gap-4 rounded-xl border border-[#d3bbcc] bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] p-5 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-bold text-[#39265f]">Student</label>
            <input
              className={`${field} mb-2`}
              placeholder="Search by name, student number or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className={field} value={studentId} onChange={(e) => setStudentId(e.target.value)} size={5}>
              {filteredStudents.length === 0 && <option disabled>No students found</option>}
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} — {s.student_number}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-[#39265f]">Category</label>
              <select
                className={field}
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as "academic" | "generated")}
              >
                {ADMIN_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-[#39265f]">Folder</label>
              <select className={field} value={docType} onChange={(e) => setDocType(e.target.value)}>
                {typeOptions.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-[#39265f]">File</label>
            <input
              key={fileKey}
              type="file"
              accept={ACCEPT_ATTR}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[#39265f] file:mr-3 file:rounded-lg file:border-0 file:bg-[#c195b6] file:px-4 file:py-2 file:font-bold file:text-white"
            />
            <p className="mt-1 text-xs text-[#5a4a75]">PDF, JPG, PNG or DOCX, up to 10 MB.</p>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#8f7aa8] px-5 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-[#7b6694] disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {busy ? "Uploading..." : "Upload for student"}
          </button>
        </form>

        {studentId && (
          <section className="mt-8">
            <h2 className="mb-3 text-2xl font-semibold text-[#39265f]" style={{ fontFamily: "Georgia, serif" }}>
              Files already given to this student
            </h2>
            {docs.length === 0 ? (
              <p className="text-sm italic text-[#5a4a75]">No Academic or Generated files yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-1 rounded-xl border border-[#d3bbcc] bg-white/50 pr-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpen(d)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left hover:bg-white/60"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-[#6d5b7a]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#39265f]">{d.name}</span>
                        <span className="block text-xs text-[#5a4a75]">
                          {d.category} &bull; {labelFor(d.category, d.doc_type)} &bull; {formatDate(d.created_at)}{" "}
                          &bull; {formatSize(d.file_size)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
                      aria-label={`Delete ${d.name}`}
                      className="rounded-lg p-2 text-[#6d5b7a] hover:bg-white/60 hover:text-[#671410]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}