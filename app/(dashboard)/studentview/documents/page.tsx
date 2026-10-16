"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  FileText,
  FileCheck,
  FileDown,
  ChevronRight,
  Upload,
  Trash2,
} from "lucide-react";
import { Syne } from "next/font/google";
import { createClient } from "@/utils/supabase/client";
import {
  CATEGORIES,
  ACCEPT_ATTR,
  safeFileName,
  formatDate,
  formatSize,
  validateFile,
  type DocumentItem,
  type TabOption,
} from "@/lib/documentConfig";

const supabase = createClient();
const display = Syne({ subsets: ["latin"], weight: ["600", "700"] });

const TABS: TabOption[] = ["All", "Academic", "Generated", "Submitted"];

const TAB_COLORS: Record<TabOption, string> = {
  All: "bg-[#c195b6] text-white",
  Academic: "bg-[#a686b3] text-white",
  Generated: "bg-[#b57c9f] text-white",
  Submitted: "bg-[#8f7aa8] text-white",
};

async function getSignedUrl(path: string, opts?: { download?: string }): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 60, opts?.download ? { download: opts.download } : undefined);
  if (error) {
    console.error(error.message);
    return null;
  }
  return data.signedUrl;
}

const ROW_CLASSES =
  "rounded-xl border border-[#d3bbcc] bg-gradient-to-r from-[#efd9e7] to-[#f4e1eb] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all duration-200 hover:border-[#9b51e0]";

const IconBadge = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-[#a686b3] to-[#6d5b7a] flex items-center justify-center shadow-inner">
    <Icon size={28} className="text-[#e2d5e3]" />
  </div>
);

export default function MyDocumentsMain() {
  const [activeTab, setActiveTab] = useState<TabOption>("All");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<string | null>(null);

  const loadDocuments = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    setUserId(user.id);

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setDocuments(data as DocumentItem[]);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadDocuments();
      } catch (e) {
        console.error(e);
        setError("Could not load your documents. Refresh the page to try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleCategories = CATEGORIES.filter((c) => activeTab === "All" || c.tab === activeTab);
  const visibleDocuments = documents.filter((d) => visibleCategories.some((c) => c.key === d.category));

  const recentFiles = useMemo(
    () =>
      [...documents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3),
    [documents]
  );

  const handleOpenDocument = async (doc: DocumentItem) => {
    const win = window.open("", "_blank"); // open inside the click so popup blockers allow it
    const url = await getSignedUrl(doc.file_path);
    if (url && win) {
      win.location.href = url;
    } else {
      win?.close();
      setError("This file could not be opened. Please try again.");
    }
  };

  const handleViewDocuments = () => {
    setActiveTab("All");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDownloadFiles = async () => {
    if (visibleDocuments.length === 0) {
      setNotice("There are no files to download in this tab.");
      return;
    }
    setIsDownloading(true);
    try {
      for (const doc of visibleDocuments) {
        const url = await getSignedUrl(doc.file_path, { download: doc.name });
        if (!url) continue;
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // ---- student upload (Submitted folders only) ----
  const startUpload = (docType: string) => {
    pendingTypeRef.current = docType;
    fileInputRef.current?.click();
  };

  const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const docType = pendingTypeRef.current;
    e.target.value = ""; // allow choosing the same file again
    if (!files.length || !docType || !userId) return;

    setError(null);
    setNotice(null);
    setUploadingType(docType);

    let uploaded = 0;
    for (const file of files) {
      const problem = validateFile(file);
      if (problem) {
        setError(`${file.name}: ${problem}`);
        continue;
      }

      const path = `${userId}/submitted/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
        contentType: file.type,
      });
      if (upErr) {
        setError(`${file.name}: upload failed. ${upErr.message}`);
        continue;
      }

      const { error: dbErr } = await supabase.from("documents").insert({
        user_id: userId,
        name: file.name,
        category: "submitted",
        doc_type: docType,
        file_path: path,
        file_size: file.size,
      });
      if (dbErr) {
        await supabase.storage.from("documents").remove([path]); // don't leave an orphan file
        setError(`${file.name}: could not be saved. ${dbErr.message}`);
        continue;
      }
      uploaded += 1;
    }

    try {
      await loadDocuments();
    } catch (err) {
      console.error(err);
    }
    if (uploaded > 0) setNotice(`${uploaded} file${uploaded === 1 ? "" : "s"} uploaded.`);
    setUploadingType(null);
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    const { error: dbErr } = await supabase.from("documents").delete().eq("id", doc.id);
    if (dbErr) {
      setError(`Could not delete the file. ${dbErr.message}`);
      return;
    }
    await supabase.storage.from("documents").remove([doc.file_path]);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  };

  return (
    <div className="flex-1 h-full min-h-screen bg-[#feeaee] p-8 overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleFilesChosen}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-4 text-[#39265f]">
          <BookOpen size={48} strokeWidth={1.5} className="shrink-0 fill-[#39265f] text-white" />
          <div>
            <h1 className="text-5xl font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              My Documents
            </h1>
            <p className="text-sm text-[#5a4a75] mt-1">Access and manage your academic and personal documents.</p>
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center my-6 opacity-60">
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
          <div className="mx-4 text-[#39265f] flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-4 h-2 rounded-full bg-[#39265f]"></span>
            <span className="w-2 h-2 rounded-full bg-[#39265f]"></span>
          </div>
          <div className="h-[2px] bg-[#39265f] flex-1 rounded-full"></div>
        </div>

        {/* Tabs Section */}
        <div className="flex gap-4 mb-8" role="tablist" aria-label="Document categories">
          {TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-lg shadow-sm transition-transform hover:scale-105 active:scale-95 ${TAB_COLORS[tab]} ${
                activeTab === tab ? "ring-2 ring-offset-2 ring-[#39265f]/30" : "opacity-90"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-center text-sm text-[#671410]">{error}</p>}
        {notice && <p className="mb-4 text-center text-sm text-[#2f6b3a]">{notice}</p>}

        {/* List + side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
          <div ref={listRef} className="scroll-mt-4">
            {loading ? (
              <p className="text-center text-[#5a4a75] py-8">Loading documents...</p>
            ) : (
              <div className="flex flex-col gap-8 pb-8">
                {visibleCategories.map((category) => {
                  const canUpload = category.key === "submitted"; // students only upload here
                  return (
                    <section key={category.key}>
                      <h2 className="text-2xl font-semibold text-[#39265f]" style={{ fontFamily: "Georgia, serif" }}>
                        {category.title}
                      </h2>
                      <p className="text-sm text-[#5a4a75] mb-3">{category.subtitle}</p>

                      <div className="flex flex-col gap-3">
                        {category.items.map((item) => {
                          const id = `${category.key}:${item.key}`;
                          const expanded = expandedType === id;
                          const files = documents.filter(
                            (d) => d.category === category.key && d.doc_type === item.key
                          );
                          const latest = files.length > 0 ? files[0].created_at : null;
                          const busy = uploadingType === item.key && canUpload;

                          return (
                            <div key={id} className={ROW_CLASSES}>
                              <button
                                type="button"
                                onClick={() => setExpandedType((prev) => (prev === id ? null : id))}
                                aria-expanded={expanded}
                                className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-5 min-w-0">
                                  <IconBadge icon={category.icon} />
                                  <div className="flex flex-col">
                                    <h3
                                      className="text-[1.15rem] font-bold text-[#39265f] mb-0.5"
                                      style={{ fontFamily: "Georgia, serif" }}
                                    >
                                      {item.label}
                                    </h3>
                                    <p className="text-sm text-[#5a4a75]">
                                      {latest ? `Last updated ${formatDate(latest)}` : "No files yet"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 shrink-0">
                                  <div
                                    className={`px-6 py-1.5 rounded-full font-bold text-sm min-w-[110px] text-center shadow-sm ${
                                      files.length > 0 ? "bg-[#c195b6] text-white" : "bg-[#e3d3de] text-[#6d5b7a]"
                                    }`}
                                  >
                                    {files.length > 0
                                      ? `${files.length} ${files.length === 1 ? "file" : "files"}`
                                      : "Empty"}
                                  </div>
                                  <ChevronRight
                                    size={32}
                                    strokeWidth={3}
                                    className={`text-[#6d5b7a] transition-transform duration-200 ${
                                      expanded ? "rotate-90" : ""
                                    }`}
                                  />
                                </div>
                              </button>

                              {expanded && (
                                <div className="border-t border-[#d3bbcc] bg-white/30 px-4 py-2 rounded-b-xl">
                                  {canUpload && (
                                    <button
                                      type="button"
                                      onClick={() => startUpload(item.key)}
                                      disabled={busy}
                                      className="my-2 inline-flex items-center gap-2 rounded-lg bg-[#8f7aa8] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#7b6694] disabled:opacity-60"
                                    >
                                      <Upload className="w-4 h-4" />
                                      {busy ? "Uploading..." : "Upload file"}
                                    </button>
                                  )}

                                  <ul>
                                    {files.length === 0 ? (
                                      <li className="px-3 py-2 text-sm italic text-[#5a4a75]">
                                        {canUpload
                                          ? "Nothing here yet. Use Upload file to add one (PDF, JPG, PNG or DOCX, up to 10 MB)."
                                          : "Nothing here yet. Files from the school will show up here."}
                                      </li>
                                    ) : (
                                      files.map((file) => (
                                        <li key={file.id} className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenDocument(file)}
                                            className="flex-1 min-w-0 flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/60"
                                          >
                                            <FileText className="w-5 h-5 shrink-0 text-[#6d5b7a]" />
                                            <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#39265f]">
                                              {file.name}
                                            </span>
                                            <span className="shrink-0 text-xs text-[#5a4a75]">
                                              {formatDate(file.created_at)} &nbsp;&bull;&nbsp;{" "}
                                              {formatSize(file.file_size)}
                                            </span>
                                          </button>
                                          {canUpload && (
                                            <button
                                              type="button"
                                              onClick={() => handleDelete(file)}
                                              aria-label={`Delete ${file.name}`}
                                              className="shrink-0 rounded-lg p-2 text-[#6d5b7a] transition-colors hover:bg-white/60 hover:text-[#671410]"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                        </li>
                                      ))
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side panel: Quick Actions + Recent Files */}
          <aside className="rounded-lg border border-[#7d4f78] bg-[#a4668f] p-4 text-white shadow-md lg:sticky lg:top-0">
            <h3 className={`${display.className} text-sm font-bold mb-2`}>Quick Actions</h3>
            <button
              type="button"
              onClick={handleViewDocuments}
              className={`${display.className} mb-2 flex w-full items-center gap-3 rounded bg-white/25 px-2 py-2 text-left text-xs font-bold transition-colors hover:bg-white/35`}
            >
              <FileCheck className="w-6 h-6 shrink-0" strokeWidth={1.5} /> View Documents
            </button>
            <button
              type="button"
              onClick={handleDownloadFiles}
              disabled={isDownloading}
              className={`${display.className} mb-5 flex w-full items-center gap-3 rounded bg-white/25 px-2 py-2 text-left text-xs font-bold transition-colors hover:bg-white/35 disabled:opacity-60`}
            >
              <FileDown className="w-6 h-6 shrink-0" strokeWidth={1.5} />
              {isDownloading ? "Downloading..." : "Download Files"}
            </button>

            <h3 className={`${display.className} text-sm font-bold mb-2`}>Recent Files</h3>
            {loading ? (
              <p className="text-xs text-white/80">Loading files...</p>
            ) : recentFiles.length === 0 ? (
              <p className="text-xs text-white/80">No files yet. Documents you receive or upload will show up here.</p>
            ) : (
              <ul className="space-y-2">
                {recentFiles.map((file) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(file)}
                      className="flex w-full items-center gap-3 rounded bg-white/25 px-2 py-2 text-left transition-colors hover:bg-white/35"
                    >
                      <FileText className="w-7 h-7 shrink-0 fill-[#4b3554] text-white" strokeWidth={1.5} />
                      <span className="min-w-0">
                        <span className={`${display.className} block truncate text-xs font-bold`}>{file.name}</span>
                        <span className="block text-[10px] opacity-90">
                          {formatDate(file.created_at)} &nbsp;&bull;&nbsp; {formatSize(file.file_size)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}