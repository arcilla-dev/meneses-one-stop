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
import { Dela_Gothic_One } from "next/font/google";
import Image from "next/image";
// Uncomment when wiring up to real data:
// import { createClient } from "@/utils/supabase/client";
// const supabase = createClient();

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

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

// Tab colors (same family as the Requests page filters)
const TAB_COLORS: Record<TabOption, string> = {
  All: "bg-[#956084] text-white",
  Academic: "bg-[#b477a1] text-white",
  Generated: "bg-[#a686b3] text-white",
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

// Same card look as the Requests page
const ROW_CLASSES =
  "rounded-xl border border-[#c48ab2] bg-gradient-to-r from-[#dfb5d1]/90 via-[#d4a9c8]/85 to-[#a991b8]/85 shadow-sm transition duration-200 hover:border-[#956084] hover:shadow-md";

const IconBadge = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-gradient-to-br from-[#b477a1] to-[#6d5b7a] shadow-inner sm:h-14 sm:w-14">
    <Icon size={25} strokeWidth={1.8} className="text-white sm:h-7 sm:w-7" />
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
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Faded campus logo background */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 h-0"
      >
        <div className="absolute left-0 top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <img
            src="/icons/docs-bg.png"
            alt=""
            className="h-[90vh] w-auto max-w-none -translate-y-[4%] select-none opacity-25"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Header Section */}
        <div className="flex items-center gap-3 text-[#39265f] md:gap-4">
            <Image
              src="/icons/documents-icon.png"
              alt="Notification"
              width={50}
              height={46}
              className="h-14 w-16 object-contain sm:h-15 sm:w-17"
            />
          <div>
            <h1
              className={`${delaGothicOne.className} text-2xl tracking-wide sm:text-3xl md:text-4xl xl:text-5xl`}
            >
              My Documents
            </h1>
            <p
              className="mt-1 text-xs tracking-wide text-[#6d5b7a] sm:text-sm md:tracking-widest"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Access and manage your academic and personal documents.
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-5 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-3 flex gap-1 text-[#39265f] md:mx-4">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Tabs Section */}
        <div
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-8 md:gap-4"
          role="tablist"
          aria-label="Document categories"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`${delaGothicOne.className} rounded-xl px-3 py-3 text-xs shadow-sm transition hover:brightness-105 active:scale-95 sm:text-sm md:py-4 ${
                TAB_COLORS[tab]
              } ${
                activeTab === tab
                  ? "ring-2 ring-[#39265f]/40 ring-offset-2 ring-offset-[#ffd9e8]"
                  : "opacity-90"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List + side panel */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* Folder list */}
          <div ref={listRef} className="scroll-mt-4">
            {loading ? (
              <p className="py-8 text-center text-[#6d5b7a]">Loading documents...</p>
            ) : (
              <div className="flex flex-col gap-8 pb-8">
                {error && <p className="text-center text-sm text-[#671410]">{error}</p>}

                {visibleCategories.map((category) => (
                  <section key={category.key}>
                    <h2
                      className="text-xl font-bold text-[#39265f] md:text-2xl"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {category.title}
                    </h2>
                    <p className="mb-3 text-xs text-[#5a4a75] sm:text-sm">{category.subtitle}</p>

                    <div className="flex flex-col gap-3 md:gap-4">
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
                              className="flex w-full cursor-pointer items-center justify-between gap-3 p-3 text-left sm:p-4 md:gap-5"
                            >
                              <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                                <IconBadge icon={category.icon} />
                                <div className="flex min-w-0 flex-col">
                                  <h3
                                    className="mb-0.5 break-words text-base font-bold text-[#39265f] sm:text-lg md:text-xl"
                                    style={{ fontFamily: "Georgia, serif" }}
                                  >
                                    {item.label}
                                  </h3>
                                  <p className="text-xs text-[#5a4a75] sm:text-sm">
                                    {latest ? `Last updated ${formatDate(latest)}` : "No files yet"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2 sm:gap-4 md:gap-5">
                                <div
                                  className={`min-w-[76px] rounded-full px-2 py-1 text-center text-[10px] font-bold shadow-sm sm:min-w-[100px] sm:px-4 sm:py-1.5 sm:text-xs ${
                                    files.length > 0 ? "bg-[#956084] text-white" : "bg-[#e3d3de] text-[#6d5b7a]"
                                  }`}
                                >
                                  {files.length > 0 ? `${files.length} ${files.length === 1 ? "file" : "files"}` : "Empty"}
                                </div>
                                <ChevronRight
                                  size={24}
                                  strokeWidth={2.5}
                                  className={`shrink-0 text-[#6d5b7a] transition-transform duration-200 sm:h-7 sm:w-7 ${
                                    expanded ? "rotate-90" : ""
                                  }`}
                                />
                              </div>
                            </button>

                            {expanded && (
                              <ul className="rounded-b-xl border-t border-[#c48ab2] bg-white/30 px-3 py-2 sm:px-4">
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
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/60"
                                      >
                                        <FileText className="h-5 w-5 shrink-0 text-[#6d5b7a]" />
                                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#39265f]">
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
          <aside className="rounded-xl border border-[#39265f]/30 bg-[#956084] p-4 text-white shadow-md lg:sticky lg:top-0">
            <h3 className={`${delaGothicOne.className} mb-2 text-sm`}>Quick Actions</h3>
            <button
              type="button"
              onClick={handleViewDocuments}
              className={`${delaGothicOne.className} mb-2 flex w-full items-center gap-3 rounded-lg bg-white/25 px-2 py-2 text-left text-xs transition-colors hover:bg-white/35`}
            >
              <FileCheck className="h-6 w-6 shrink-0" strokeWidth={1.5} /> View Documents
            </button>
            <button
              type="button"
              onClick={handleDownloadFiles}
              disabled={isDownloading}
              className={`${delaGothicOne.className} mb-5 flex w-full items-center gap-3 rounded-lg bg-white/25 px-2 py-2 text-left text-xs transition-colors hover:bg-white/35 disabled:opacity-60`}
            >
              <FileDown className="h-6 w-6 shrink-0" strokeWidth={1.5} />
              {isDownloading ? "Downloading..." : "Download Files"}
            </button>

            <h3 className={`${delaGothicOne.className} mb-2 text-sm`}>Recent Files</h3>
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
                      className="flex w-full items-center gap-3 rounded-lg bg-white/25 px-2 py-2 text-left transition-colors hover:bg-white/35"
                    >
                      <FileText className="h-7 w-7 shrink-0 fill-[#4b3554] text-white" strokeWidth={1.5} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold" style={{ fontFamily: "Georgia, serif" }}>
                          {file.name}
                        </span>
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