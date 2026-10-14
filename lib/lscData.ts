// Types, constants, and display text for the LSC page.
// Mock records live in lscMock.ts so they can be deleted when Supabase is connected.

export type PaperSizeId = "letter" | "a4" | "legal";
export type ColorId = "bw" | "colored";
export type LayoutId = "portrait" | "landscape";

export const REQUEST_STATUSES = [
  "Pending",
  "Printing",
  "Ready for claiming",
  "Claimed",
  "Cancelled",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface PrintRequest {
  id: string;
  requestNumber: string; // "LSC-2026-00001"
  fileNames: string[]; // TODO (Supabase): store Storage file paths instead
  paperSize: PaperSizeId;
  color: ColorId;
  layout: LayoutId;
  pages: number;
  additionalRequest: string;
  totalBill: number; // estimate only; the server sets the real value
  status: RequestStatus;
  dateSubmitted: string; // ISO "YYYY-MM-DD"
  claimedAt?: string | null; // ISO "YYYY-MM-DD"
}

/** What the form hands to the page. The page adds id, number, status, bill, date. */
export interface PrintRequestDraft {
  files: File[];
  paperSize: PaperSizeId;
  color: ColorId;
  layout: LayoutId;
  pages: number;
  additionalRequest: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string; // ISO "YYYY-MM-DD"
  read: boolean;
  pinned?: boolean;
}

export interface LSCNotification {
  id: string;
  title: string;
  message: string;
  date: string; // ISO "YYYY-MM-DD"
  read: boolean;
}

// TODO (Supabase): replace with the real LSC rates and rules (confirm with LSC officers), ideally from an admin-managed table.
export const PAPER_SIZES: { id: PaperSizeId; label: string; dimensions: string }[] = [
  { id: "letter", label: "Letter", dimensions: "8.5 x 11" },
  { id: "a4", label: "A4", dimensions: "8.27 x 11.69" },
  { id: "legal", label: "Legal", dimensions: "8.5 x 13" },
];

export const PRINT_RATES: Record<PaperSizeId, Record<ColorId, number>> = {
  letter: { bw: 2, colored: 5 },
  a4: { bw: 2, colored: 5 },
  legal: { bw: 3, colored: 6 },
};

export const COLOR_OPTIONS: { id: ColorId; label: string }[] = [
  { id: "bw", label: "Black & White" },
  { id: "colored", label: "Colored" },
];

export const LAYOUT_OPTIONS: { id: LayoutId; label: string }[] = [
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
];

export const PRINT_LIMITS = {
  maxPages: 100,
  maxFileSizeMB: 10,
  acceptedTypes: ["pdf", "docx", "jpg", "png"],
  maxFilesPerRequest: 5,
};

export const LSC_PAYMENT_NOTE =
  "Payment is made at the LSC office when you claim your copy.";
export const LSC_CLAIM_NOTE =
  "Present your Student ID or any one valid ID when claiming.";
export const LSC_OFFICE_HOURS = "Monday to Friday, 9:00 AM to 4:00 PM";

/** Next status in the flow. Used by the dev-only "Advance status" button. */
export const NEXT_STATUS: Partial<Record<RequestStatus, RequestStatus>> = {
  Pending: "Printing",
  Printing: "Ready for claiming",
  "Ready for claiming": "Claimed",
};

export const statusStyles: Record<RequestStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Printing: "bg-blue-100 text-blue-800",
  "Ready for claiming": "bg-green-100 text-green-800",
  Claimed: "bg-gray-200 text-gray-700",
  Cancelled: "bg-red-100 text-red-800",
};

export const statusDescriptions: Partial<Record<RequestStatus, string>> = {
  Pending: "Waiting for LSC to start printing.",
  Printing: "Your document is being printed.",
  "Ready for claiming": `Your document/s is now available. ${LSC_CLAIM_NOTE} ${LSC_PAYMENT_NOTE}`,
  Cancelled: "This request was cancelled.",
};