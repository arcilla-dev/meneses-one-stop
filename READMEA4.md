---

# LSC (admin)

Two admin pages:

- **Printing Requests:** process or reject the print requests students submit
- **Services:** add, edit and enable/disable the LSC's services

## Add to Folder layout
```
lib/
  adminLscApi.ts              LSC mapping: print requests, signed file URLs, services
supabase/
  admin-lsc.sql               Documentation copy of the LSC admin SQL
lsc/                          (wherever your admin pages live)
  PrintingRequestsPage.tsx    List + process/reject print requests
  ServicesPage.tsx            Service list with inline add / edit
```

## How it works
- **Printing Requests:** row click -> modal -> Process or Reject -> `decidePrintRequest`. The update only applies while the request is still `pending`, so two admins can't overwrite each other. The student is notified by the database trigger `lsc_notify_request`.
- **Files:** `file_paths` are turned into signed URLs (valid 1 hour) from the private `print-files` bucket.
- **Total** comes from `print_requests.total_bill`, which the database computes from `lsc_rates`.
- **Services:** `lsc_services` table (separate from the infirmary `services` table). Add and edit write straight to it. On failure the form stays open and the message shows above the list.

## Status mapping
| Database (`print_requests.status`) | Shown in the admin UI |
|---|---|
| `pending` | Pending |
| `printing`, `ready`, `claimed` | Processed |
| `rejected` | Rejected |
| `cancelled` (student cancelled) | not shown |

The **Process** button sets `printing` (change `PROCESS_TO` in `adminLscApi.ts` to `'ready'` if you prefer). Later steps are done in SQL (see below).

## Field mapping
| UI field | Source |
|---|---|
| Type | `paper_size` + `color` (`letter` -> Letter, `a4` -> A4, `legal` -> Legal, `bw` -> B&W, `colored` -> Colored) |
| Layout / Pages / Additional request | `layout`, `pages`, `additional_request` |
| Total | `total_bill` |
| Attachments | `file_paths` + `file_names` |
| Decision remarks | `remarks` (rejection: `Reason — remarks`) |
| Student name, number, program | same as the registrar pages |

## Database objects added
| Object | Purpose |
|---|---|
| Columns `remarks`, `handled_by`, `handled_at` | On `print_requests` |
| Status `rejected` | Added to the `print_requests` status check |
| `grant update (status, remarks)` | Staff can write the note (RLS still blocks students) |
| `lsc_notify_request()` (updated) | Adds the rejected message and includes the note |
| Table `lsc_services` | `name` (unique, case-insensitive), `description`, `is_active`. Students can read it; only staff can change it. |

## Setup order
1. Student-side LSC SQL, then `supabase/admin-registrar.sql` (for `is_staff()` and `stamp_handler()`).
2. `supabase/admin-lsc.sql`.
3. Copy `adminLscApi.ts` into `lib/` and replace the two pages.

## Handling a request without the UI
```sql
update public.print_requests set status = 'ready'   where request_number = 'LSC-2026-00001';
update public.print_requests set status = 'claimed'  where request_number = 'LSC-2026-00001';
update public.print_requests set status = 'rejected', remarks = 'File is unreadable' where request_number = 'LSC-2026-00001';
```

## Known limitations
- Only **Process** and **Reject** exist in the UI. Moving a request on to Ready or Claimed is done in SQL.
- The student side must know the new `rejected` status (add it to `STATUS_FROM_DB` in `lscApi.ts`).
- The "Notify student" checkbox does nothing (notifications always come from the trigger).
- Data loads once on mount; reload the page to see changes made elsewhere.
- Signed URLs expire after 1 hour.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| Requests page is empty | `admin-lsc.sql` not run, or `profiles.role` isn't `admin` / `superadmin` |
| `violates check constraint "print_requests_status_check"` | `admin-lsc.sql` step 2 not run |
| `column "remarks" does not exist` | `admin-lsc.sql` has not been run |
| "permission denied for table print_requests" on decide | `grant update (status, remarks)` missing |
| Paper/Type shows lowercase (e.g. `a4`) | The form sends a value that isn't in the mapping in `adminLscApi.ts` |
| Add service fails with "already exists" | Service names must be unique |