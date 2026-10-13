<!-- Merge into your main README.md. -->

# Add to the intro list
- **LSC (Local Student Council):** overview, print service requests, my requests, announcements, notifications

# Add to Stack
- Reuses `registrarDisplayFont` from `registrar/lib/registrarFonts` (via `lsc/lib/lscFonts.ts`)

# Add to Folder layout
```
lsc/
  page.tsx                    State, handlers, Supabase TODOs
  lib/
    lscData.ts                Types, rates, limits, status styles/descriptions, notes (no mock data)
    lscUtils.ts               computeBill, formatPeso, ISO date helpers, request-number preview
    lscMock.ts                MOCK print requests, announcements, notifications (delete when Supabase is connected)
    lscFonts.ts               Re-exports registrarDisplayFont (adjust the path if folders differ)
  components/
    LSCHeader.tsx             Banner + tabs (exports LSC_TABS, LSCTab)
    OverviewTab.tsx           Student info, stats, "ready for claiming" banner, latest announcement, quick actions
    ServicesTab.tsx           Success banner + PrintRequestForm + FeaturedServices
    PrintRequestForm.tsx      Booking form with file upload; calls async onSubmit(draft)
    FeaturedServices.tsx      Rate table and office hours
    MyRequestsTab.tsx         Filter by status, search, list of requests
    PrintRequestItem.tsx      One request row: expand, cancel, dev-only advance status
    AnnouncementsTab.tsx      Announcement list (newest first)
    AnnouncementItem.tsx      One announcement
    NotificationsTab.tsx      Click to mark read, delete, clear all
```

# LSC: how it works
- **Print request:** `PrintRequestForm` validates (pages 1-100, 1-5 files, PDF/DOCX/JPG/PNG up to 10 MB each, no identical Pending request) and calls `onSubmit(draft)`. The page adds the id, request number, status, bill, and date. Throwing an `Error` shows the message in the form.
- **My Requests:** filter by All / Pending / Printing / Ready for claiming / Claimed / Cancelled, search by file name or request number. A student can cancel Pending requests only.
- **Advance status button:** shown only when `NODE_ENV === 'development'`. In production the LSC/admin side changes the status.
- **Announcements:** opening the tab marks all as read.
- **Notifications:** click an item to mark it read; delete one or clear all. The header tab shows an unread count.
- **Rates and rules:** `PAPER_SIZES`, `PRINT_RATES`, `PRINT_LIMITS` in `lib/lscData.ts` are placeholders. Confirm with LSC officers.

# Add to Conventions
- **Dates:** LSC stores dates as ISO `YYYY-MM-DD` and formats them only for display (`formatDisplayDate`).
- **Types:** `PrintRequest` is `{ id, requestNumber, fileNames, paperSize, color, layout, pages, additionalRequest, totalBill, status, dateSubmitted, claimedAt? }`. `PrintRequestDraft` is what the form sends: `{ files: File[], paperSize, color, layout, pages, additionalRequest }`.

# Add to Supabase plan
| Table | Used by | Key columns |
|---|---|---|
| `print_requests` | LSC | `student_id`, `request_number` (DB-generated), `file_paths` (text[]), `paper_size`, `color`, `layout`, `pages`, `additional_request`, `total_bill`, `status`, `created_at`, `claimed_at` |
| `announcements` | LSC | `title`, `message`, `pinned`, `created_at` |
| `announcement_reads` | LSC | `announcement_id`, `student_id`, `read_at` |
| `lsc_rates` (optional) | LSC | `paper_size`, `color`, `price_per_page` (replaces `PRINT_RATES`) |

`notifications` is shared: use `module = 'lsc'`.

To do:
1. **Replace mock data** with fetches (print requests, announcements, notifications) and delete `lscMock.ts`.
2. **Row Level Security** on `print_requests`, `announcement_reads`, `notifications` (`auth.uid() = student_id`). `announcements` is read-only for students.
3. **File uploads:** upload each `File` to a private Storage bucket first (path `{auth.uid()}/{request_id}/{file_name}`), then save only the paths in `print_requests.file_paths`. Add Storage RLS so a student can read only their own folder.
4. **Request number:** generate in the database (sequence + trigger, format `LSC-YYYY-00001`). The client preview in `nextRequestNumber` can collide.
5. **Never trust the client** for `status`, `total_bill`, or `request_number`. Compute the bill in a DB function from `lsc_rates`.
6. **Cancel rule:** allow a student to set `Cancelled` only when the current status is `Pending` (RLS policy or RPC).
7. **Status changes** (Pending -> Printing -> Ready for claiming -> Claimed) happen on the admin side. Create the "ready for claiming" notification with a DB trigger.
8. **Duplicate check:** the client blocks identical Pending requests; enforce it in the database too if it matters.

# Add to Known placeholders
- LSC: rates, limits, office hours, and payment/claim notes are placeholders.
- LSC: mock records use dates relative to today.
- LSC: the Overview "Services" list and the header text are hard-coded.