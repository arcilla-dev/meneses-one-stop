---

# Scholarship (admin)

Two admin pages:

- **Scholarship Applications:** list, approve or reject the applications students submit
- **Programs:** add, edit and activate/deactivate scholarship programs

## Add to Folder layout
```
lib/
  adminScholarshipApi.ts          Scholarship mapping: applications, signed file URLs, programs
supabase/
  admin-scholarship.sql           Documentation copy of the scholarship admin SQL
scholarship/                      (wherever your admin pages live)
  ScholarshipApplicationsPage.tsx List + approve/reject applications
  ScholarshipProgramsPage.tsx     Program list with add / edit form
```

## How it works
- **Applications:** row click -> modal -> Approve or Reject -> `decideApplication`. The update only applies while the application is still `pending`, so two admins can't overwrite each other. The student is notified by the existing `notify_on_application` trigger.
- **Attachments:** the file paths in `applications.document_files` are turned into signed URLs (valid 1 hour) from the private `scholarship-documents` bucket.
- **Programs:** stored in the `scholarships` table. `name`, `required_documents` and `is_active` are real columns; `description`, `eligibility`, `benefits`, `period_start` and `period_end` live in the `data` jsonb column. Editing keeps any other keys already in `data`.
- **Scholarship tabs** are built from the scholarship names that have applications.

## Status mapping
| Database (`applications.status`) | Shown in the admin UI |
|---|---|
| `pending` / `approved` / `rejected` | Pending / Approved / Rejected |

## Field mapping
| UI field | Source |
|---|---|
| Scholarship | `scholarships.name` (via `scholarship_id`) |
| Student name | `student_profiles.full_name`, falling back to `profiles.full_name` |
| Student number | `student_profiles.student_number` |
| Program/Yr/Sec | `student_profiles.program` + `year_section` |
| GPA | `applications.gpa` |
| Date | `applications.created_at` |
| Attachments | `applications.document_files` (`label`, `name`, `path`) |
| Decision remarks | `applications.remarks` (rejection: `Reason — remarks`) |

## Database objects added
| Object | Purpose |
|---|---|
| Columns `handled_by`, `handled_at` | On `applications` (filled by `stamp_handler`) |
| Policies `Staff read all` / `Staff update all` | On `applications` |
| Policy `Staff manage scholarships` | Admins can add and edit programs (no delete) |
| Policy `Staff read scholarship files` | Lets admins open files in `scholarship-documents` |

## Setup order
1. Student-side scholarship SQL.
2. `supabase/admin-registrar.sql` (for `is_staff()` and `stamp_handler()`).
3. `supabase/admin-scholarship.sql`.
4. Copy `adminScholarshipApi.ts` into `lib/` and replace the two pages.

## Handling an application without the UI
```sql
update public.applications set status = 'approved' where application_id = 'SCH-2026-00001';
update public.applications set status = 'rejected', remarks = 'Incomplete documents' where application_id = 'SCH-2026-00001';
```

## Known limitations
- The "Notify student" checkbox does nothing (notifications always come from the trigger).
- Data loads once on mount; reload to see changes made elsewhere.
- Programs can't be deleted (applications reference them); set them Inactive instead.
- Students can still read inactive programs unless the student side filters on `is_active`.
- Programs created here only have the keys the form sends. If the student side reads other `data` keys (for example a deadline or slots), add them to the form.
- Signed URLs expire after 1 hour; reload the page for fresh links.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| Applications are empty for an admin | `admin-scholarship.sql` not run, or `profiles.role` isn't `admin` / `superadmin` |
| Student name shows "Unknown student" | Missing `student_profiles` row, or `admin-registrar.sql` (profile read policies) not run |
| "This application was already handled..." | Someone else decided it first, or the account isn't staff; reload |
| Saving a program fails with a row-level security error | The account isn't staff |
| Attachment links open `#` or fail | `Staff read scholarship files` policy missing, or the stored `path` is wrong |