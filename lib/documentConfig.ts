import type React from "react";
import { GraduationCap, FileSignature, Upload } from "lucide-react";

export type DocCategory = "academic" | "generated" | "submitted";
export type TabOption = "All" | "Academic" | "Generated" | "Submitted";

export interface DocumentItem {
  id: string;
  user_id: string;
  name: string;
  category: DocCategory;
  doc_type: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

export interface CategoryConfig {
  key: DocCategory;
  tab: TabOption;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: { key: string; label: string }[]; // each key matches documents.doc_type
}

export const CATEGORIES: CategoryConfig[] = [
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

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // matches the bucket limit
export const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.docx";

export const safeFileName = (name: string) => name.replace(/[^\w.\- ]+/g, "_");

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

export const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/** Returns an error message, or null if the file is fine. */
export const validateFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PDF, JPG, PNG or DOCX files are allowed.";
  if (file.size > MAX_FILE_BYTES) return "File is too large. The limit is 10 MB.";
  return null;
};