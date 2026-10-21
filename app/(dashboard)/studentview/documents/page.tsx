"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
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
  created_at: string;
}

interface CategoryConfig {
  key: DocCategory;
  tab: TabOption;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: { key: string; label: string }[];
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

/* ---------- Shared UI tokens (identical across all pages) ---------- */
const NAV_BTN =
  "flex h-14 w-full items-center justify-center rounded-lg border-2 border-[#956084] px-3 text-center text-sm leading-tight tracking-wide shadow-sm transition hover:brightness-105 active:scale-95 md:h-16 md:text-base";
const CARD_TITLE = "text-base font-bold text-[#39265f] sm:text-lg";
const CARD_TEXT = "text-sm text-[#6d5b7a]";
const ICON_BADGE =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#956084] bg-[#c48ab2]/70 sm:h-14 sm:w-14";

const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "1",
    name: "COR_2026.pdf",
    category: "academic",
    doc_type: "cor",
    file_path: "mock/COR_2026.pdf",
    file_size: 2516582,
    created_at: "2026-09-20T09:00:00Z",
  },
  {
    id: "2",
    name: "COG-3rdyr_2ndsem.pdf",
    category: "academic",
    doc_type: "grades",
    file_path: "mock/COG-3rdyr_2ndsem.pdf",
    file_size: 1887436,
    created_at: "2026-09-12T09:00:00Z",
  },
  {
    id: "3",
    name: "Medical Certificate.pdf",
    category: "generated",
    doc_type: "forms",
    file_path: "mock/Medical Certificate.pdf",
    file_size: 2097152,
    created_at: "2026-08-29T09:00:00Z",
  },
  {
    id: "4",
    name: "Scholarship_Form.pdf",
    category: "submitted",
    doc_type: "scholarship_requirements",
    file_path: "mock/Scholarship_Form.pdf",
    file_size: 1258291,
    created_at: "2026-08-10T09:00:00Z",
  },
];

async function fetchDocuments(): Promise<DocumentItem[]> {
  // Supabase version:
  // const { data: { user } } = await supabase.auth.getUser();
  // const { data, error } = await supabase
  //   .from("documents")
  //   .select("*")
  //   .eq("user_id", user?.id)
  //   .order("created_at", { ascending: false });
  // if (error) throw error;
  // return data as DocumentItem[];

  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_DOCUMENTS;
}

async function getSignedUrl(
  path: string,
  opts?: { download?: string }
): Promise<string | null> {
  // Supabase version:
  // const { data, error } = await supabase.storage
  //   .from("documents")
  //   .createSignedUrl(
  //     path,
  //     60,
  //     opts?.download ? { download: opts.download } : undefined
  //   );
  // if (error) {
  //   console.error(error.message);
  //   return null;
  // }
  // return data.signedUrl;

  void path;
  void opts;
  return null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";

  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const ROW_CLASSES =
  "overflow-hidden rounded-lg border-2 border-[#c48ab2] bg-[#fbe6f0]/90 shadow-sm transition hover:border-[#956084]";

const IconBadge = ({ icon: Icon }: { icon: React.ElementType }) => (
  <div className={ICON_BADGE}>
    <Icon size={24} className="text-[#39265f] sm:h-7 sm:w-7" />
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

        if (!cancelled) {
          setDocuments(docs);
        }
      } catch (e) {
        console.error(e);

        if (!cancelled) {
          setError(
            "Could not load your documents. Refresh the page to try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCategories = CATEGORIES.filter(
    (category) => activeTab === "All" || category.tab === activeTab
  );

  const visibleDocuments = documents.filter((doc) =>
    visibleCategories.some((category) => category.key === doc.category)
  );

  const recentFiles = useMemo(
    () =>
      [...documents]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 3),
    [documents]
  );

  const handleOpenDocument = async (doc: DocumentItem) => {
    const win = window.open("", "_blank");
    const url = await getSignedUrl(doc.file_path);

    if (url && win) {
      win.location.href = url;
    } else {
      win?.close();
      alert(
        "This file can't be opened yet. Connect Supabase Storage to open real files."
      );
    }
  };

  const handleViewDocuments = () => {
    setActiveTab("All");
    listRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleDownloadFiles = async () => {
    if (visibleDocuments.length === 0) {
      alert("There are no files to download in this tab.");
      return;
    }

    setIsDownloading(true);
    let downloaded = 0;

    try {
      for (const doc of visibleDocuments) {
        const url = await getSignedUrl(doc.file_path, {
          download: doc.name,
        });

        if (!url) continue;

        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        a.remove();

        downloaded += 1;

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (downloaded === 0) {
        alert(
          "Files can't be downloaded yet. Connect Supabase Storage to enable downloads."
        );
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex-1 overflow-y-auto bg-[#ffd9e8] p-4 md:p-8">
      {/* Background logo */}
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
        {/* Header */}
        <div className="flex items-center gap-4 text-[#39265f]">
          <Image
            src="/icons/documents-icon.png"
            alt="My Documents"
            width={56}
            height={56}
            className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          />

          <div>
            <h1
              className={`${delaGothicOne.className} text-3xl tracking-wide md:text-5xl`}
            >
              My Documents
            </h1>

            <p
              className="mt-1 text-sm tracking-widest text-[#6d5b7a]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Access and manage your academic and personal documents
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="my-4 flex items-center justify-center opacity-60 md:my-6">
          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />

          <div className="mx-4 flex gap-1 text-[#39265f]">
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
            <span className="h-2 w-4 rounded-full bg-[#39265f]" />
            <span className="h-2 w-2 rounded-full bg-[#39265f]" />
          </div>

          <div className="h-[2px] flex-1 rounded-full bg-[#39265f]" />
        </div>

        {/* Document tabs */}
        <div
          className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:mb-6 md:gap-4"
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
              className={`${delaGothicOne.className} ${NAV_BTN} ${
                TAB_COLORS[tab]
              } ${
                activeTab === tab
                  ? "ring-2 ring-offset-2 ring-[#39265f]/30"
                  : ""
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Document list and side panel */}
        <div className="grid grid-cols-1 items-start gap-5 pb-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6">
          {/* Folder list */}
          <div ref={listRef} className="min-w-0 scroll-mt-4">
            {loading ? (
              <p className="py-8 text-center text-[#6d5b7a]">
                Loading documents...
              </p>
            ) : (
              <div className="flex flex-col gap-7">
                {error && (
                  <p className="rounded-lg border-2 border-[#956084] bg-[#fff0f6]/90 p-3 text-sm text-[#671410]">
                    {error}
                  </p>
                )}

                {visibleCategories.map((category) => (
                  <section key={category.key}>
                    <h2
                      className={`${delaGothicOne.className} text-lg tracking-wide text-[#39265f] sm:text-xl`}
                    >
                      {category.title}
                    </h2>

                    <p
                      className="mb-3 mt-1 text-sm text-[#6d5b7a]"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {category.subtitle}
                    </p>

                    <div className="flex flex-col gap-3">
                      {category.items.map((item) => {
                        const id = `${category.key}:${item.key}`;
                        const expanded = expandedType === id;

                        const files = documents.filter(
                          (doc) =>
                            doc.category === category.key &&
                            doc.doc_type === item.key
                        );

                        const latest =
                          files.length > 0
                            ? files.reduce((newest, file) =>
                                new Date(file.created_at).getTime() >
                                new Date(newest.created_at).getTime()
                                  ? file
                                  : newest
                              ).created_at
                            : null;

                        return (
                          <div key={id} className={ROW_CLASSES}>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedType((prev) =>
                                  prev === id ? null : id
                                )
                              }
                              aria-expanded={expanded}
                              className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-[#dfb5d1]/30 sm:gap-4 sm:p-4"
                            >
                              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                <IconBadge icon={category.icon} />

                                <div className="min-w-0">
                                  <h3
                                    className={`mb-1 ${CARD_TITLE}`}
                                    style={{ fontFamily: "Georgia, serif" }}
                                  >
                                    {item.label}
                                  </h3>

                                  <p className={CARD_TEXT}>
                                    {latest
                                      ? `Last updated ${formatDate(latest)}`
                                      : "No files yet"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                                <span
                                  className={`rounded-md border border-[#956084] px-2 py-1 text-center text-xs font-bold sm:min-w-[90px] sm:px-3 sm:text-sm ${
                                    files.length > 0
                                      ? "bg-[#956084] text-white"
                                      : "bg-[#e8c4da] text-[#6d5b7a]"
                                  }`}
                                >
                                  {files.length > 0
                                    ? `${files.length} ${
                                        files.length === 1 ? "file" : "files"
                                      }`
                                    : "Empty"}
                                </span>

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
                              <ul className="border-t-2 border-[#c48ab2] bg-[#fff0f6]/60 px-3 py-2 sm:px-4">
                                {files.length === 0 ? (
                                  <li className="px-2 py-3 text-sm italic text-[#6d5b7a]">
                                    Nothing here yet. Files added to this folder
                                    will show up here.
                                  </li>
                                ) : (
                                  files.map((file) => (
                                    <li key={file.id}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenDocument(file)
                                        }
                                        className="flex w-full items-center gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-[#dfb5d1]/40"
                                      >
                                        <FileText className="h-5 w-5 shrink-0 text-[#956084]" />

                                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#39265f] sm:text-base">
                                          {file.name}
                                        </span>

                                        <span className="shrink-0 text-right text-xs text-[#6d5b7a] sm:text-sm">
                                          {formatDate(file.created_at)}
                                          <span className="hidden sm:inline">
                                            {" "}
                                            • {formatSize(file.file_size)}
                                          </span>
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

          {/* Quick Actions and Recent Files */}
          <aside className="rounded-lg border-2 border-[#956084] bg-[#dfb5d1]/90 p-4 text-[#39265f] shadow-sm lg:sticky lg:top-4">
            <h3
              className={`${delaGothicOne.className} mb-3 text-base tracking-wide`}
            >
              Quick Actions
            </h3>

            <button
              type="button"
              onClick={handleViewDocuments}
              className="mb-2 flex h-12 w-full items-center gap-3 rounded-md border border-[#956084] bg-[#fff0f6]/80 px-3 text-left text-sm font-semibold transition hover:bg-white active:scale-[0.99] md:text-base"
            >
              <FileCheck
                className="h-5 w-5 shrink-0 text-[#6d5b7a]"
                strokeWidth={1.8}
              />
              View Documents
            </button>

            <button
              type="button"
              onClick={handleDownloadFiles}
              disabled={isDownloading}
              className="mb-6 flex h-12 w-full items-center gap-3 rounded-md border border-[#956084] bg-[#fff0f6]/80 px-3 text-left text-sm font-semibold transition hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 md:text-base"
            >
              <FileDown
                className="h-5 w-5 shrink-0 text-[#6d5b7a]"
                strokeWidth={1.8}
              />

              {isDownloading ? "Downloading..." : "Download Files"}
            </button>

            <div className="mb-4 h-px bg-[#956084]/50" />

            <h3
              className={`${delaGothicOne.className} mb-3 text-base tracking-wide`}
            >
              Recent Files
            </h3>

            {loading ? (
              <p className="text-sm text-[#6d5b7a]">Loading files...</p>
            ) : recentFiles.length === 0 ? (
              <p className="text-sm text-[#6d5b7a]">
                No files yet. Documents you receive or upload will show up
                here.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentFiles.map((file) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(file)}
                      className="flex w-full items-center gap-3 rounded-md border border-[#c48ab2] bg-[#fff0f6]/80 px-2 py-3 text-left transition hover:bg-white"
                    >
                      <FileText className="h-6 w-6 shrink-0 text-[#956084]" />

                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-sm font-bold text-[#39265f]"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {file.name}
                        </span>

                        <span className="mt-1 block text-xs text-[#6d5b7a]">
                          {formatDate(file.created_at)} •{" "}
                          {formatSize(file.file_size)}
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