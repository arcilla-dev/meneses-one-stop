// Mock data. TODO (Supabase): delete this file once the page fetches real rows.
import {
  LSC_OFFICE_HOURS,
  type Announcement,
  type LSCNotification,
  type PrintRequest,
} from "./lscData";
import { computeBill, dateOffset } from "./lscUtils";

// TODO (Supabase): fetch the signed-in student's rows from `print_requests`.
export const MOCK_PRINT_REQUESTS: PrintRequest[] = [
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
    claimedAt: null,
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
    claimedAt: dateOffset(-4),
  },
];

// TODO (Supabase): fetch from `announcements` (read state comes from a per-student table or `is_read` on a join).
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "lsc-announcement-1",
    title: "Welcome to the LSC",
    message:
      "The Local Student Council is here to support students and share important campus updates.",
    date: dateOffset(-1),
    read: false,
  },
  {
    id: "lsc-announcement-2",
    title: "Council Office Hours",
    message: `The LSC office is open ${LSC_OFFICE_HOURS}.`,
    date: dateOffset(-3),
    read: false,
  },
];

// TODO (Supabase): fetch from `notifications` where module = 'lsc'.
export const MOCK_NOTIFICATIONS: LSCNotification[] = [];