// One config per office. The page reads profile.office and picks the matching entry.

export type DashboardOffice = "registrar" | "lsc" | "scholarship" | "infirmary";
export type Status = "Pending" | "Approved" | "Processed" | "Rejected";

export type Column = { key: string; label: string; align?: "left" | "center" };
export type Row = { id: string; status: Status } & Record<string, string>;

export type QuickAction = { label: string; href: string };

export type OfficeConfig = {
  office: DashboardOffice;
  title: string;                // shown in the header, e.g. "Registrar"
  fallbackName: string;         // used when profiles.full_name is empty
  approvedLabel: "Approved" | "Processed";
  columns: Column[];
  requestsHref: string;         // "View all" + row click base path
  quickActions: QuickAction[];
};

export const OFFICES: Record<DashboardOffice, OfficeConfig> = {
  registrar: {
    office: "registrar",
    title: "Registrar",
    fallbackName: "Registrar",
    approvedLabel: "Approved",
    requestsHref: "/adminv2/registrar/document-requests",
    columns: [
      { key: "type", label: "Request Type", align: "left" },
      { key: "student", label: "Student Name", align: "left" },
      { key: "course", label: "Course/Yr/Sec" },
      { key: "date", label: "Date" },
    ],
    quickActions: [
      { label: "View Requests", href: "/adminv2/registrar/document-requests" },
      { label: "Add/ Remove Subjects", href: "/adminv2/registrar/add-remove-subjects" },
      { label: "Manage Announcements", href: "/adminv2/announcements" },
    ],
  },
  lsc: {
    office: "lsc",
    title: "LSC",
    fallbackName: "LSC",
    approvedLabel: "Processed",
    requestsHref: "/adminv2/lsc/lsc-service-requests",
    columns: [
      { key: "paper", label: "Type", align: "left" },
      { key: "color", label: "Color" },
      { key: "pages", label: "Pages" },
      { key: "student", label: "Student Name", align: "left" },
      { key: "course", label: "Course/Yr/Sec" },
    ],
    quickActions: [
      { label: "View Requests", href: "/adminv2/lsc/lsc-service-requests" },
      { label: "Manage Services", href: "/adminv2/lsc/lsc-services" },
      { label: "Manage Announcements", href: "/adminv2/announcements" },
    ],
  },
  scholarship: {
    office: "scholarship",
    title: "Scholarship",
    fallbackName: "Scholar",
    approvedLabel: "Approved",
    requestsHref: "/adminv2/scholarship/scholarship-applications",
    columns: [
      { key: "scholarship", label: "Scholarship", align: "left" },
      { key: "student", label: "Student Name", align: "left" },
      { key: "course", label: "Course/Yr/Sec" },
      { key: "date", label: "Date" },
    ],
    quickActions: [
      { label: "View Applications", href: "/adminv2/scholarship/scholarship-applications" },
      { label: "Manage Scholarships", href: "/adminv2/scholarship/scholarship-programs" },
      { label: "Manage Announcements", href: "/adminv2/announcements" },
    ],
  },
  infirmary: {
    office: "infirmary",
    title: "Infirmary",
    fallbackName: "Doc",
    approvedLabel: "Approved",
    requestsHref: "/adminv2/infirmary/appointment-requests",
    columns: [
      { key: "service", label: "Service", align: "left" },
      { key: "student", label: "Student Name", align: "left" },
      { key: "course", label: "Course/Yr/Sec" },
      { key: "date", label: "Date" },
    ],
    quickActions: [
      { label: "View Requests", href: "/adminv2/infirmary/appointment-requests" },
      { label: "View Appointments", href: "/adminv2/infirmary/appointments" },
      { label: "Manage Services", href: "/adminv2/infirmary/services" },
      { label: "Manage Announcements", href: "/adminv2/announcements" },
    ],
  },
};

export const isOffice = (v: unknown): v is DashboardOffice =>
  typeof v === "string" && v in OFFICES;

// TODO: replace with Supabase queries (limit 5, order by created_at desc, filtered by office).
// Matches StatBreakdown in RequestStatCards (only the registrar splits documents vs subjects for now)
type Breakdown = Partial<Record<"total" | "pending" | "approved" | "rejected", { documents: number; subjects: number }>>;

export const MOCK: Record<DashboardOffice, { stats: [number, number, number, number]; breakdown?: Breakdown; rows: Row[] }> = {
  registrar: {
    stats: [69, 30, 18, 21],
    breakdown: {
      total: { documents: 45, subjects: 24 },
      pending: { documents: 20, subjects: 10 },
      approved: { documents: 12, subjects: 6 },
      rejected: { documents: 13, subjects: 8 },
    },
    rows: [
      { id: "1", type: "Report of Grades", student: "Josh Nathaniel R. Arcilla", course: "BSCpE - 4B", date: "05/10/2026", status: "Pending" },
      { id: "2", type: "Certificate of Registration", student: "Hazel Rose V. de Guzman", course: "BSCpE - 4B", date: "05/04/2026", status: "Approved" },
      { id: "3", type: "Add Subject “CPE 402”", student: "Cloiez Veniz L. Belmonte", course: "BSCpE - 4B", date: "05/01/2026", status: "Pending" },
      { id: "4", type: "Wala kanen busseng?", student: "Jerome S. Lagarde", course: "BSCpE - 4B", date: "04/26/2026", status: "Rejected" },
    ],
  },
  lsc: {
    stats: [69, 15, 45, 9],
    rows: [
      { id: "1", paper: "A4", color: "Colored", pages: "35", student: "Josh Nathaniel R. Arcilla", course: "BSCpE - 4B", status: "Pending" },
      { id: "2", paper: "Long", color: "B&W", pages: "2", student: "Hazel Rose V. de Guzman", course: "BSCpE - 4B", status: "Pending" },
      { id: "3", paper: "Long", color: "Colored", pages: "18", student: "Cloiez Veniz L. Belmonte", course: "BSCpE - 4B", status: "Processed" },
      { id: "4", paper: "Short", color: "B&W", pages: "3", student: "Jerome S. Lagarde", course: "BSCpE - 4B", status: "Rejected" },
      { id: "5", paper: "A4", color: "B&W", pages: "40", student: "Jerome S. Lagarde", course: "BSCpE - 4B", status: "Processed" },
    ],
  },
  scholarship: {
    stats: [69, 15, 45, 9],
    rows: [
      { id: "1", scholarship: "Financial Assistance", student: "Josh Nathaniel R. Arcilla", course: "BSCpE - 4B", date: "05/10/2026", status: "Pending" },
      { id: "2", scholarship: "Academic Scholarship", student: "Hazel Rose V. de Guzman", course: "BSCpE - 4B", date: "05/04/2026", status: "Approved" },
      { id: "3", scholarship: "Academic Scholarship", student: "Cloiez Veniz L. Belmonte", course: "BSCpE - 4B", date: "05/01/2026", status: "Pending" },
      { id: "4", scholarship: "Scholarship ni Josh", student: "Jerome S. Lagarde", course: "BSCpE - 4B", date: "04/26/2026", status: "Rejected" },
      { id: "5", scholarship: "Financial Assistance", student: "Jerome S. Lagarde", course: "BSCpE - 4B", date: "04/26/2026", status: "Approved" },
    ],
  },
  infirmary: {
    stats: [69, 21, 41, 7],
    rows: [
      { id: "1", service: "Medical Consultation", student: "Josh Nathaniel R. Arcilla", course: "BSCpE - 4B", date: "05/10/2026", status: "Pending" },
      { id: "2", service: "Vital Signs Check", student: "Hazel Rose V. de Guzman", course: "BSCpE - 4B", date: "05/04/2026", status: "Approved" },
      { id: "3", service: "Dental Check-up", student: "Cloiez Veniz L. Belmonte", course: "BSCpE - 4B", date: "05/01/2026", status: "Pending" },
      { id: "4", service: "Medical Certificate", student: "Jerome S. Lagarde", course: "BSCpE - 4B", date: "04/26/2026", status: "Rejected" },
      { id: "5", service: "Other Infirmary Requests", student: "Jerome S. Lagarde", course: "BSCpE - 4B", date: "04/26/2026", status: "Approved" },
    ],
  },
};
