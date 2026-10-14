# Student Portal: Registrar + Infirmary (Next.js + Tailwind, Supabase-ready)

Two student-facing pages that share the same look and the same patterns:

- **Registrar:** overview, document requests, add/remove subjects, notifications
- **Infirmary:** overview, request a clinic schedule, my appointments, notifications

Both currently run on **mock `useState` data**. The next step is replacing the mock data with **Supabase**. Every spot to change is marked `TODO (Supabase)` in each `page.tsx`.

## Stack
- Next.js App Router (`'use client'` components) and TypeScript
- Tailwind CSS for pages and tabs
- Plain CSS (`styles/modals.css`, `rm-*` classes) for the Registrar modals only
- `lucide-react` icons and `next/font/google` (Dela Gothic One)
- **Required existing file:** `@/contexts/UserProfileContext` must export `UserProfileProvider` and `useUserProfile()`, which returns `{ studentProfile, loading }`. Fields used: `full_name`, `student_number`, `program`, `year_section`.
- Assets: `/public/campus-bg.png` (header background)

## Folder layout
```
registrar/
  page.tsx                    State, handlers, modal wiring, Supabase TODOs
  lib/
    requestForms.ts           Config-driven document forms + shared types (Subject, FieldConfig, FormValues...)
    registrarData.ts          Types, constants, card text, MOCK data
    registrarFonts.ts         next/font display font (also reused by Infirmary)
  components/
    Modal.tsx                 Portal popup shell: focus trap, Esc/backdrop close, `locked` while saving
    RequestFormModal.tsx      Builds a form from a RequestFormConfig; calls onSubmit(values, config)
    ConfirmModal.tsx          Add/remove subject confirm with reason; calls onConfirm(reason)
    AddSubjectModal.tsx       Searchable subject list; calls onPick(subject)
    RegistrarHeader.tsx       Banner + tabs (exports REGISTRAR_TABS, RegistrarTab)
    OverviewTab.tsx           Student info, stats, "ready for claiming" banner, quick actions
    RequestsTab.tsx           Document cards from requestForms; calls onSelect(config)
    SubjectsTab.tsx           Current subjects table (Remove per row, "+ Add subject"), pending panel
    NotificationsTab.tsx      Notification list with delete / clear all
  styles/modals.css           Modal styles

infirmary/
  page.tsx                    State, handlers, Supabase TODOs 
  lib/
    infirmaryData.ts          Types, services, time slots, icons, statusStyles, MOCK data
    infirmaryUtils.ts         Date/time helpers (ISO dates, "09:30 AM" parsing, formatting)
    infirmaryFonts.ts         Re-exports registrarDisplayFont (adjust the path if folders differ)
  components/
    InfirmaryHeader.tsx       Banner + tabs (exports INFIRMARY_TABS, InfirmaryTab)
    OverviewTab.tsx           Student info, stats, next appointment, upcoming, notifications
    RequestScheduleTab.tsx    Booking form + upcoming sidebar; calls async onSubmit(draft)
    MyAppointmentsTab.tsx     Filter by status, Upcoming / Past groups
    AppointmentItem.tsx       One appointment row: cancel, dev-only approve/reject
    NotificationsTab.tsx      Notification list (click to mark read, delete, clear all)
```
Import paths in each `page.tsx` assume `components/` and `lib/` sit next to it. `infirmaryFonts.ts` assumes `registrar/` and `infirmary/` are siblings. Adjust if yours differ.

## Registrar: how it works
- **Document request:** `RequestsTab` -> page sets `activeForm` -> `RequestFormModal` -> `submitDocumentRequest(values, config)`. Throwing an `Error` shows the message inside the modal. A pending duplicate of the same `requestType` is blocked, except `other`.
- **Add subject:** "+ Add subject" -> `AddSubjectModal` -> `onPick` -> `ConfirmModal mode="add"` -> `confirmSubjectChange(reason)`.
- **Remove subject:** row "Remove" button -> `ConfirmModal mode="remove"` -> `confirmSubjectChange(reason)`.
- **Notifications:** `addNotification(message)` adds an unread item. Opening the Notifications tab marks all as read.
- **New document type:** add an entry in `requestForms` (`lib/requestForms.ts`), add its id to `RequestFormId`, and add a description and processing time in `requestCards` (`lib/registrarData.ts`).

### The three modal layers
- `Modal`: the empty popup shell. It has no form or buttons of its own.
- `RequestFormModal`: a form popup built from a config; handles validation and calls your `onSubmit`.
- `ConfirmModal`: a reason-picker popup for add/remove subject; calls your `onConfirm(reason)`.
- `AddSubjectModal` is also built on `Modal` and hands off to `ConfirmModal`.

## Infirmary: how it works
- **Request a schedule:** `RequestScheduleTab` validates (service, clinic day Mon-Fri, not in the past, free time slot, no overlap with an existing active appointment) and calls `onSubmit(draft)`. The page inserts the row and creates the notification. Throwing an `Error` shows it in the form.
- **My Appointments:** filter by All / Pending / Approved / Rejected / Cancelled / Completed. Appointments are grouped into Upcoming and Past. A student can cancel Pending or Approved ones.
- **Approve / Reject buttons:** shown only when `NODE_ENV === 'development'`. In production the clinic/admin side changes the status.
- **Notifications:** click an item to mark it read; delete one or clear all.

## Conventions worth knowing
- **Dates:** the Infirmary stores dates as ISO `YYYY-MM-DD` and formats them only for display (`formatDisplayDate`). Never parse `"Oct 05, 2026"` strings.
- **Times:** `"09:30 AM"` strings. Convert to 24-hour if you store them in Supabase `time` columns.
- **Throw to show errors:** async `onSubmit` / `onConfirm` handlers throw `Error(message)` and the UI displays it.
- **Types:** `Subject` is `{ code, title, units: number, day, time }`. `FormValues` is `Record<string, string | File | null>`. `Appointment` is `{ id, service, date, timeStart, timeEnd, status, remarks, dateSubmitted? }`.

## Supabase plan (not connected yet)
| Table | Used by | Key columns |
|---|---|---|
| `requests` | Registrar | `student_id`, `request_type`, `details` (jsonb of form values), `status`, `created_at` |
| `subject_changes` | Registrar | `student_id`, `subject_code`, `kind` ('add'/'remove'), `reason`, `status` |
| `subjects` | Registrar | `code`, `title`, `units`, `day`, `time` |
| `appointments` | Infirmary | `student_id`, `service`, `date`, `time_start`, `time_end`, `status`, `remarks`, `created_at` |
| `notifications` | Both | `student_id`, `module` ('registrar'/'infirmary'), `message`, `type`, `is_read`, `created_at` |

To do:
1. **Replace mock data** with fetches (subjects, appointments, notifications, student profile).
2. **Row Level Security** on every table so students only see their own rows (`auth.uid() = student_id`).
3. **File attachments** (Registrar "Other" request): upload the `File` to Supabase Storage first, then save only the file path in `requests.details`. A `File` can't go in a column.
4. **Status changes** (Pending -> Approved/Rejected, Ready for claiming) happen on the admin side. Create the matching notification with a DB trigger, not only from the client.
5. **Never trust the client** for status or anything fee-related. Set those server-side.
6. **Slot conflicts:** the client checks overlaps, but enforce it in the database too (unique constraint or check) so two bookings can't take the same slot.

## Known placeholders
- Registrar: `day`/`time` on sample subjects are made up; `CURRENT_TERM` and Enrollment Status in `OverviewTab` are hard-coded.
- Both: mock notifications and appointments use fixed dates (some are already in the past).
- Fonts: `modals.css` loads Unbounded/Manrope from Google Fonts, while pages use Dela Gothic One via `next/font`.