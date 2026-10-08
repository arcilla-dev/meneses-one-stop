"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  FileText,
  FileCheck,
  FileDown,
  FileSignature,
  GraduationCap,
  Upload,
  ChevronRight,
} from "lucide-react";
import { Syne } from "next/font/google";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

// Used only for the side panel's headings and file names, to match the mockup.
const display = Syne({ subsets: ["latin"], weight: ["600", "700"] });

type DocCategory = "academic" | "generated" | "submitted";
type TabOption = "All" | "Academic" | "Generated" | "Submitted";

interface DocumentItem {
  id: string;
  name: string;
  category: DocCategory;
  doc_type: string;
  file_path: string;
  file_size: number | null;
  created_at: string; // ISO timestamp
}

interface CategoryConfig {
  key: DocCategory;
  tab: TabOption;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: { key: string; label: string }[]; // each key matches documents.doc_type
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "academic",
    tab: "Academic",
    title: "Academic Documents",
    subtitle: "Important school-related documents",
    icon: GraduationCap,
    items: [
      { key: "cor", label: "Certificate of Registration" },
      { key: "grades", label: "Report of Grades" },
      { key: "records", label: "Student Records" },
    ],
  },
  {
    key: "generated",
    tab: "Generated",
    title: "Generated Documents",
    subtitle: "Documents issued by the university",
    icon: FileSignature,
    items: [
      { key: "approved_cor", label: "Approved COR" },
      { key: "certificates", label: "Requested Certificates" },
      { key: "forms", label: "Forms / Other Documents" },
    ],
  },
  {
    key: "submitted",
    tab: "Submitted",
    title: "Submitted Documents",
    subtitle: "Files you have uploaded or submitted",
    icon: Upload,
    items: [
      { key: "scholarship_requirements", label: "Scholarship Requirements" },
      { key: "registrar_requirements", label: "Registrar Requirements" },
      { key: "other_uploads", label: "Other Uploaded Files" },
    ],
  },
];

const TABS: TabOption[] = ["All", "Academic", "Generated", "Submitted"];

const TAB_COLORS: Record<TabOption, string> = {
  All: "bg-[#c195b6] text-white",
  Academic: "bg-[#a686b3] text-white",
  Generated: "bg-[#b57c9f] text-white",
  Submitted: "bg-[#8f7aa8] text-white",
};

// ---------------------------------------------------------------------------
// Data layer — the ONLY place that needs to change when you connect Supabase.
// ---------------------------------------------------------------------------
const MOCK_DOCUMENTS: DocumentItem[] = [
  { id: "1", name: "COR_2026.pdf", category: "academic", doc_type: "cor", file_path: "mock/COR_2026.pdf", file_size: 2516582, created_at: "2026-09-20T09:00:00Z" },
  { id: "2", name: "COG-3rdyr_2ndsem.pdf", category: "academic", doc_type: "grades", file_path: "mock/COG-3rdyr_2ndsem.pdf", file_size: 1887436, created_at: "2026-09-12T09:00:00Z" },
  { id: "3", name: "Medical Certificate.pdf", category: "generated", doc_type: "forms", file_path: "mock/Medical Certificate.pdf", file_size: 2097152, created_at: "2026-08-29T09:00:00Z" },
  { id: "4", name: "Scholarship_Form.pdf", category: "submitted", doc_type: "scholarship_requirements", file_path: "mock/Scholarship_Form.pdf", file_size: 1258291, created_at: "2026-08-10T09:00:00Z" },
];

async function fetchDocuments(): Promise<DocumentItem[]> {
  // --- Supabase version (uncomment, then delete the mock block below) ---
  // const { data: { user } } = await supabase.auth.getUser();
  // const { data, error } = await supabase
  //   .from("documents")
  //   .select("*")
  //   .eq("user_id", user?.id)
  //   .order("created_at", { ascending: false });
  // if (error) throw error;
  // return data as DocumentItem[];

  // --- Mock version ---
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_DOCUMENTS;
}

// Returns a short-lived URL for a private file. Pass { download } to force a file download.
async function getSignedUrl(path: string, opts?: { download?: string }): Promise<string | null> {
  // --- Supabase version (uncomment, then delete the mock line below) ---
  // const { data, error } = await supabase.storage
  //   .from("documents")
  //   .createSignedUrl(path, 60, opts?.download ? { download: opts.download } : undefined);
  // if (error) { console.error(error.message); return null; }
  // return data.signedUrl;

  // --- Mock version ---
  void path;
  void opts;
  return null;
}

// ---------------------------------------------------------------------------
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await fetchDocuments();
        if (!cancelled) setDocuments(docs);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load your documents. Refresh the page to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
    // Open the tab inside the click so popup blockers allow it, then point it at the signed URL.
    const win = window.open("", "_blank");
    const url = await getSignedUrl(doc.file_path);
    if (url && win) {
      win.location.href = url;
    } else {
      win?.close();
      alert("This file can't be opened yet. Connect Supabase Storage to open real files.");
    }
  };

  const handleViewDocuments = () => {
    setActiveTab("All");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Downloads every file in the currently selected tab.
  const handleDownloadFiles = async () => {
    if (visibleDocuments.length === 0) {
      alert("There are no files to download in this tab.");
      return;
    }
    setIsDownloading(true);
    let downloaded = 0;
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
        downloaded += 1;
        await new Promise((resolve) => setTimeout(resolve, 300)); // keeps browsers from dropping back-to-back downloads
      }
      if (downloaded === 0) alert("Files can't be downloaded yet. Connect Supabase Storage to enable downloads.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex-1 h-full min-h-screen bg-[#feeaee] p-8 overflow-y-auto">
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

        {/* List + side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 items-start">
          {/* Folder list */}
          <div ref={listRef} className="scroll-mt-4">
            {loading ? (
              <p className="text-center text-[#5a4a75] py-8">Loading documents...</p>
            ) : (
              <div className="flex flex-col gap-8 pb-8">
                {error && <p className="text-center text-sm text-[#671410]">{error}</p>}

                {visibleCategories.map((category) => (
                  <section key={category.key}>
                    <h2 className="text-2xl font-semibold text-[#39265f]" style={{ fontFamily: "Georgia, serif" }}>
                      {category.title}
                    </h2>
                    <p className="text-sm text-[#5a4a75] mb-3">{category.subtitle}</p>

                    <div className="flex flex-col gap-3">
                      {category.items.map((item) => {
                        const id = `${category.key}:${item.key}`;
                        const expanded = expandedType === id;
                        const files = documents.filter((d) => d.category === category.key && d.doc_type === item.key);
                        const latest = files.length > 0 ? files[0].created_at : null;

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
                                  {files.length > 0 ? `${files.length} ${files.length === 1 ? "file" : "files"}` : "Empty"}
                                </div>
                                <ChevronRight
                                  size={32}
                                  strokeWidth={3}
                                  className={`text-[#6d5b7a] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                                />
                              </div>
                            </button>

                            {expanded && (
                              <ul className="border-t border-[#d3bbcc] bg-white/30 px-4 py-2 rounded-b-xl">
                                {files.length === 0 ? (
                                  <li className="px-3 py-2 text-sm italic text-[#5a4a75]">
                                    Nothing here yet. Files added to this folder will show up here.
                                  </li>
                                ) : (
                                  files.map((file) => (
                                    <li key={file.id}>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDocument(file)}
                                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/60"
                                      >
                                        <FileText className="w-5 h-5 shrink-0 text-[#6d5b7a]" />
                                        <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#39265f]">
                                          {file.name}
                                        </span>
                                        <span className="shrink-0 text-xs text-[#5a4a75]">
                                          {formatDate(file.created_at)} &nbsp;&bull;&nbsp; {formatSize(file.file_size)}
                                        </span>
                                      </button>
                                    </li>
                                  ))
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
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