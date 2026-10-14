# Admin: Registrar + Infirmary (Next.js + Tailwind + Supabase)

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
- Registrar and Infirmary are connected. `adminApi.ts` also has functions for print requests, announcements and scholarship applications, but those tables need their own staff policies (a short SQL per office).

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


---

# Infirmary (admin)

Three admin pages:

- **Appointment Requests:** approve or reject the appointments students request
- **Appointments:** calendar and schedule of approved appointments (view-only)
- **Services:** add, edit and enable/disable the clinic's services

## Add to Folder layout
```
lib/
  adminInfirmaryApi.ts      Infirmary mapping: requests, schedule, services
supabase/
  admin-infirmary.sql       Documentation copy of the infirmary admin SQL
infirmary/                  (wherever your admin pages live)
  AppointmentRequestsPage.tsx   Approve / reject requests
  AppointmentsPage.tsx          Calendar + Today / Upcoming / Completed / Cancelled
  ServicesPage.tsx              Service list with inline add / edit
```

## How it works
- **Appointment Requests:** row click -> modal -> Approve or Reject -> `approveAppointmentRequest` / `rejectAppointmentRequest`. The update only applies while the request is still `pending`, so two admins can't overwrite each other. The student is notified by the database trigger.
- **Appointments:** shows `approved`, `completed` and `cancelled` rows. An approved appointment whose end time has passed is shown as **Completed** (derived in the browser; nothing is written back).
- **Services:** `services` table. Add and edit write straight to it. On failure the form stays open and the message shows above the list.

## Status mapping
| Database | Appointment Requests page | Appointments page |
|---|---|---|
| `pending` | Pending | not shown |
| `approved` | Approved | Scheduled (Completed once the end time has passed) |
| `completed` | Approved | Completed |
| `rejected` | Rejected | not shown |
| `cancelled` | not shown | Cancelled |

## Field mapping
| UI field | Source |
|---|---|
| Service category tab | derived from the service name (consult = MedConsult, vital = VSC, dental = Dental, certificate = MedCert, otherwise Other) |
| Preferred date / time | `appointments.date`, `time_start` - `time_end` (shown as `09:00 AM - 10:00 AM`) |
| Reason (student's) | `appointments.remarks` |
| Decision note | `appointments.admin_remarks` (reason + remarks joined as `Reason — remarks`) |
| Student name, number, program | same as the registrar pages |

## Database objects added
| Object | Purpose |
|---|---|
| Columns `admin_remarks`, `handled_by`, `handled_at` | On `appointments`. The clinic's note no longer overwrites the student's own remarks. |
| Policies `Staff read all` / `Staff update all` | On `appointments` |
| `notify_on_appointment()` (updated) | Rejection and approval messages use `admin_remarks` |
| `complete_past_appointments()` | Marks approved appointments whose end time has passed as `completed` (the student is notified) |
| `stamp_handler()` (updated) | Skips system updates so the approving admin is not overwritten |
| Table `services` | `name` (unique), `description`, `is_available`. Students can read it; only staff can change it. |

The student side shows the clinic's note when there is one (`admin_remarks`), otherwise the student's own remarks.

## Setup order
1. Student-side infirmary SQL, then `supabase/admin-registrar.sql` (for `is_staff()`).
2. `supabase/admin-infirmary.sql`.
3. Copy `adminInfirmaryApi.ts` into `lib/`, replace `adminApi.ts` and the student `infirmaryApi.ts` with the updated versions, and replace the three pages.

## Handling a request without the UI
```sql
update public.appointments set status = 'approved' where id = '<appointment id>';
update public.appointments set status = 'rejected', admin_remarks = 'Clinic closed that day' where id = '<appointment id>';
update public.appointments set status = 'completed' where id = '<appointment id>';
```

## Known limitations
- **Completed is written by `complete_past_appointments()`.** It runs whenever an admin opens the Appointments page. Enable the optional `pg_cron` job in `admin-infirmary.sql` so it also runs every 15 minutes without anyone opening the page. Its timezone is set to `Asia/Manila` inside the function.
- **Services reach the student booking form** through the optional `services` prop on `RequestScheduleTab`. If the table is empty or fails to load, the form falls back to its built-in list. A student who picks "Other" can still type any service name, so the database does not block unavailable services.
- **Two students can be approved for the same time** unless you enable the optional exclusion constraint at the bottom of `admin-infirmary.sql`.
- The "Notify student" checkbox in the modals does nothing (notifications always come from the trigger).
- Data loads once on mount; reload the page to see changes made elsewhere.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| Requests page is empty | Admin SQL not run, or the account's `profiles.role` isn't `admin` / `superadmin` |
| `column "admin_remarks" does not exist` | `admin-infirmary.sql` has not been run |
| "This request was already handled" | Someone else decided it first; reload the page |
| Add service fails with "already exists" | Service names must be unique |