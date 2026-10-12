import { computeBill } from "./utils";

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const PAPER_SIZES = [
  { id: "letter", label: "Letter", dimensions: "8.5 x 11" },
  { id: "a4", label: "A4", dimensions: "8.27 x 11.69" },
  { id: "legal", label: "Legal", dimensions: "8.5 x 13" },
];

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const PRINT_RATES = {
  letter: { bw: 2, colored: 5 },
  a4: { bw: 2, colored: 5 },
  legal: { bw: 3, colored: 6 },
};

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const COLOR_OPTIONS = [
  { id: "bw", label: "Black & White" },
  { id: "colored", label: "Colored" },
];

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const LAYOUT_OPTIONS = [
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
];

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const PRINT_LIMITS = {
  maxPages: 100,
  maxFileSizeMB: 10,
  acceptedTypes: ["pdf", "docx", "jpg", "png"],
  maxFilesPerRequest: 5,
};

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const REQUEST_STATUSES = [
  "Pending",
  "Printing",
  "Ready for claiming",
  "Claimed",
  "Cancelled",
];

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const LSC_PAYMENT_NOTE =
  "Payment is made at the LSC office when you claim your copy.";

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const LSC_CLAIM_NOTE =
  "Present your Student ID or any one valid ID when claiming.";

// TODO: replace with the real LSC rates and rules (confirm with LSC officers), ideally from admin/Supabase.
export const LSC_OFFICE_HOURS = "Monday to Friday, 9:00 AM to 4:00 PM";

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// TODO: Replace these sample records with the real student's requests from admin/Supabase.
export const MOCK_PRINT_REQUESTS = [
  {
    id: "lsc-request-thesis",
    requestNumber: "LSC-2026-00001",
    fileNames: ["Thesis_Draft.pdf"],
    paperSize: "a4",
    color: "bw",
    layout: "portrait",
    pages: 42,
    additionalRequest: "",
    totalBill: computeBill("a4", "bw", 42),
    status: "Ready for claiming",
    dateSubmitted: dateOffset(-2),
  },
  {
    id: "lsc-request-activity",
    requestNumber: "LSC-2026-00002",
    fileNames: ["Activity_Sheet.pdf"],
    paperSize: "letter",
    color: "colored",
    layout: "landscape",
    pages: 8,
    additionalRequest: "",
    totalBill: computeBill("letter", "colored", 8),
    status: "Claimed",
    dateSubmitted: dateOffset(-5),
  },
];

function announcementDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export const MOCK_ANNOUNCEMENTS = [
  {
    id: "lsc-announcement-1",
    title: "Welcome to the LSC",
    message:
      "The Local Student Council is here to support students and share important campus updates.",
    date: announcementDate(1),
  },
  {
    id: "lsc-announcement-2",
    title: "Council Office Hours",
    message: `The LSC office is open ${LSC_OFFICE_HOURS}.`,
    date: announcementDate(3),
  },
];
