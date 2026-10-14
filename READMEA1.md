# Admin: Registrar (Next.js + Tailwind + Supabase)

Admin-facing registrar pages that read and handle the requests students submit from the **Student Registrar** page. They run on **Supabase**. Admin power comes from Row Level Security policies that check `is_staff()`, **not** from the service-role key.

- **Add/Remove Subjects:** list, approve or reject subject requests
- **Document Requests:** list document requests (COR, ROG, Good Moral, Other) with a status history (view-only for now)

## Stack
- Next.js App Router (`'use client'` pages), TypeScript, Tailwind CSS
- `@supabase/ssr` browser client from `@/utils/supabase/client`
- Requires existing admin components: `RequestStatCards`, `RequestModal`, `DecisionModals`, `StatusHistoryModal`

## Folder layout
```
lib/
  adminApi.ts               Generic admin helpers: list requests with student info, set a status,
                            resolve add/remove subject, signed file URLs. Has functions for ALL offices.
  adminRegistrarApi.ts      Registrar mapping: turns database rows into the shapes the pages use
supabase/
  admin-registrar.sql       Documentation copy of the admin SQL (run it in the SQL Editor)
registrar/                  (wherever your admin pages live)
  AddRemoveSubjectsPage.tsx List + approve/reject subject requests
  DocumentRequestsPage.tsx  List document requests + Status History
```

## How it works
- **Access control:** `public.is_staff()` returns true when `profiles.role` is `admin` or `superadmin`. Policies named `Staff read all` / `Staff update all` use it. Students can still only see their own rows and can never update status.
- **Add/Remove Subjects:** row click -> request modal -> Approve or Reject -> `approveSubjectRequest` / `rejectSubjectRequest` -> RPC `resolve_subject_change`. Approving also adds or removes the subject in `student_subjects` (the student's Subjects tab updates by itself). The page reloads afterwards, and a failed action shows a red message above the modals.
- **Document Requests:** `fetchDocumentRequests()` reads `registrar_requests`, attaches the student, and builds the Status History from `created_at`, `handled_at` and `handled_by`.
- **Student notifications:** created by the database trigger `notify_on_request` whenever a status changes. The admin side never inserts notifications.

## Status mapping
| Table | Database value | Shown in the admin UI |
|---|---|---|
| `registrar_requests` | `pending`, `processing` | Pending |
| | `approved`, `ready` | Approved |
| | `rejected` | Rejected |
| `subject_changes` | `pending` / `approved` / `rejected` | Pending / Approved / Rejected |

Database statuses are lowercase; the UI capitalizes them.

## Field mapping
| UI field | Source |
|---|---|
| Student name | `student_profiles.full_name`, falling back to `profiles.full_name` |
| Program/Yr/Sec | `student_profiles.program` + `year_section` (e.g. `BSCpE - 4B`) |
| Course name / code | `subject_changes.subject_title` / `subject_code` |
| Units, schedule | `subjects` table, looked up by code |
| Current units | sum of the student's enrolled `student_subjects` |
| Reason (student's) | `subject_changes.reason` |
| Decision remarks | `remarks` (reason + remarks are joined into one value: `Reason — remarks`) |
| Reviewed by | name of `handled_by` (set automatically by `stamp_handler`) |
| Category tab | `request_type`: `report_of_grades` = ROG, `certificate_of_registration` = COR, `good_moral_certificate` = Good Moral, anything else = Other |

## Database objects added
| Object | Purpose |
|---|---|
| `is_staff()` | Role check used by every staff policy |
| `stamp_handler()` + trigger `trg_stamp_handler` | Fills `handled_by` and `handled_at` when a status changes |
| `resolve_subject_change(id, approve, remarks)` | Approve/reject a subject request and update enrollment in one step |
| Columns `remarks`, `handled_by`, `handled_at` | On `registrar_requests` and `subject_changes` |
| Policies `Staff read all` / `Staff update all` | On both request tables |
| Policies `Staff read profiles`, `Staff read student profiles`, `Staff read enrollments` | Lets admins see who the student is and what they take |
| Policy `Staff manage` | On `subjects` (admins can edit the catalog) |
| Policy `Staff read uploads` | Lets admins open files in `request-attachments` |

## Setup order
1. Student-side registrar SQL (tables, triggers, `notifications`, `subjects`, `student_subjects`).
2. `supabase/admin-registrar.sql` (this folder).
3. Copy `adminApi.ts` and `adminRegistrarApi.ts` into `lib/` and replace the two pages.
4. Make sure the admin account's `profiles.role` is `admin` or `superadmin`.

## Handling a request without the UI
Run in the SQL Editor (the student gets a notification automatically):
```sql
update public.registrar_requests set status = 'approved' where id = '<request id>';
update public.registrar_requests set status = 'rejected', remarks = 'Incomplete requirements' where id = '<request id>';
```

## Conventions
- **Two uuid columns:** `id` is the row's own id; `user_id` is the student who owns it.
- **Errors:** API functions throw `Error(message)`; pages show the message.
- **Never use the service-role client (`supabaseAdmin`) in a `'use client'` file.** Keep it for server routes only.

## Known limitations
- **Document Requests is view-only.** There are no Approve/Reject buttons yet, so documents are handled with the SQL above. `setRegistrarStatus` in `adminApi.ts` is ready for when buttons are added.
- **The "Notify student" checkbox does nothing:** notifications are always created by the database trigger.
- **Data loads once on mount.** Reload the page to see changes made elsewhere (for example, in the SQL Editor).
- **Status History is derived** from the row (submitted, then the last decision). For a full log, add a status-history table fed by a trigger.
- **Any `admin` can handle every office.** Add an `office` column to `profiles` and check it in the policies if offices must be separated.
- Only the registrar is connected. `adminApi.ts` already has functions for appointments, print requests, announcements and scholarship applications, but those tables need their own staff policies (a short SQL per office).

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| Tables are empty for an admin | Admin SQL not run, or the account's `profiles.role` isn't `admin` / `superadmin` |
| `relation ... does not exist` when running the SQL | The student-side SQL for that table hasn't been run yet |
| "Nothing was updated" or an update does nothing | The account isn't staff (RLS silently blocks it) |
| Request still shows Pending after approving | See "Why a document request can still look Pending" below |
| 401 errors | The page is using a different Supabase client than the login; import from `@/utils/supabase/client` |

### Why a document request can still look Pending
- It was approved on **Add/Remove Subjects**, which updates `subject_changes`, a different table from the one Document Requests reads.
- Its status is `processing`, which the page shows as Pending.
- The page was loaded before the change; reload it.
- Check the real value with `select id, request_type, status from public.registrar_requests;`.